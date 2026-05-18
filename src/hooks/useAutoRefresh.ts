
import { useEffect, useRef } from 'react';
import { useMVRefreshLogic } from '@/hooks/upload/useMVRefreshLogic';
import {
    buildIncrementalRefreshStatusFromQueue,
    fetchRefreshQueueSnapshot,
    getIncrementalRefreshPendingCount
} from '@/hooks/upload/refreshUtils';

const POLL_INTERVAL_MS = 5000;
const MAX_RESUME_MONITORING_MS = 60 * 60 * 1000;

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

                if (Date.now() - startedAt < MAX_RESUME_MONITORING_MS) {
                    timeoutId = setTimeout(pollQueue, POLL_INTERVAL_MS);
                }
            } catch {
                if (!cancelled && mountedRef.current) {
                    timeoutId = setTimeout(pollQueue, POLL_INTERVAL_MS * 2);
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
