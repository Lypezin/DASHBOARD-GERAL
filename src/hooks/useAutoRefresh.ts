
import { useEffect, useRef } from 'react';
import { useMVRefreshLogic } from '@/hooks/upload/useMVRefreshLogic';
import {
    buildIncrementalRefreshStatusFromQueue,
    fetchRefreshQueueSnapshot,
    getIncrementalRefreshPendingCount
} from '@/hooks/upload/refreshUtils';
import { REFRESH_MAX_MONITORING_MS, REFRESH_POLL_INTERVAL_MS, REFRESH_RETRY_POLL_INTERVAL_MS } from '@/hooks/upload/refreshTiming';
import { notifyEntregadoresRefreshComplete } from '@/utils/dashboard/dashboardDataRefreshEvents';

export function useAutoRefresh() {
    const { refreshState, setRefreshState, triggerRefresh } = useMVRefreshLogic();
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let completed = false;
        let sawPendingQueue = false;
        const startedAt = Date.now();

        const scheduleNext = (delayMs: number) => {
            if (cancelled || !mountedRef.current || completed) return;
            if (Date.now() - startedAt >= REFRESH_MAX_MONITORING_MS) return;
            if (typeof document !== 'undefined' && document.hidden) return;
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                timeoutId = null;
                void pollQueue();
            }, delayMs);
        };

        const pollQueue = async () => {
            if (cancelled || !mountedRef.current || completed) return;
            if (typeof document !== 'undefined' && document.hidden) return;

            try {
                const snapshot = await fetchRefreshQueueSnapshot(true);
                if (cancelled || !mountedRef.current) return;

                const queueState = snapshot.queueState;
                const pendingCount = getIncrementalRefreshPendingCount(queueState);

                if (pendingCount <= 0) {
                    completed = true;
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
                    if (sawPendingQueue) {
                        sawPendingQueue = false;
                        notifyEntregadoresRefreshComplete();
                    }
                    return;
                }

                sawPendingQueue = true;
                setRefreshState(buildIncrementalRefreshStatusFromQueue(queueState));
                scheduleNext(REFRESH_POLL_INTERVAL_MS);
            } catch {
                scheduleNext(REFRESH_RETRY_POLL_INTERVAL_MS);
            }
        };

        const handleVisibilityChange = () => {
            if (typeof document === 'undefined') return;
            if (document.hidden) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                return;
            }
            if (!completed && Date.now() - startedAt < REFRESH_MAX_MONITORING_MS) {
                void pollQueue();
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        void pollQueue();

        return () => {
            cancelled = true;
            mountedRef.current = false;
            if (timeoutId) clearTimeout(timeoutId);
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [setRefreshState]);

    return {
        startAutoRefresh: triggerRefresh,
        isRefreshing: refreshState.isRefreshing,
        refreshProgress: refreshState.progress,
        refreshStatus: refreshState.status
    };
}
