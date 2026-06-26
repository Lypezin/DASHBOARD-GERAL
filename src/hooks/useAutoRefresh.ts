
import { useEffect, useRef } from 'react';
import { useMVRefreshLogic } from '@/hooks/upload/useMVRefreshLogic';
import {
    buildIncrementalRefreshStatusFromQueue,
    fetchRefreshQueueSnapshot,
    getIncrementalRefreshPendingCount
} from '@/hooks/upload/refreshUtils';
import { REFRESH_MAX_MONITORING_MS, REFRESH_POLL_INTERVAL_MS, REFRESH_RETRY_POLL_INTERVAL_MS } from '@/hooks/upload/refreshTiming';

export function useAutoRefresh() {
    const { refreshState, setRefreshState, triggerRefresh } = useMVRefreshLogic();
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const startedAt = Date.now();

        const pollQueue = async () => {
            try {
                const snapshot = await fetchRefreshQueueSnapshot();
                if (cancelled || !mountedRef.current) return;

                const queueState = snapshot.queueState;
                const pendingCount = getIncrementalRefreshPendingCount(queueState);

                if (pendingCount <= 0) {
                    setRefreshState((prev) => {
                        if (!prev.isRefreshing) {
                            const hasStaleSyncMessage = /Atualizando|Sincronizando|pendente/i.test(prev.status || '');
                            return hasStaleSyncMessage
                                ? { isRefreshing: false, progress: 0, status: '' }
                                : prev;
                        }
                        return {
                            isRefreshing: false,
                            progress: 100,
                            status: 'Dados agregados, Dashboard, Comparacao e UTR atualizados.'
                        };
                    });
                    return;
                }

                setRefreshState(buildIncrementalRefreshStatusFromQueue(queueState));

                if (Date.now() - startedAt < REFRESH_MAX_MONITORING_MS) {
                    timeoutId = setTimeout(pollQueue, REFRESH_POLL_INTERVAL_MS);
                }
            } catch {
                if (!cancelled && mountedRef.current) {
                    timeoutId = setTimeout(pollQueue, REFRESH_RETRY_POLL_INTERVAL_MS);
                }
            }
        };

        void pollQueue();

        return () => {
            cancelled = true;
            mountedRef.current = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [setRefreshState]);

    return {
        startAutoRefresh: triggerRefresh,
        isRefreshing: refreshState.isRefreshing,
        refreshProgress: refreshState.progress,
        refreshStatus: refreshState.status
    };
}
