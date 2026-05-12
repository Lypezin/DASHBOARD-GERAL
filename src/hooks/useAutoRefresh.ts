
import { useEffect, useRef } from 'react';
import { useMVRefreshLogic } from '@/hooks/upload/useMVRefreshLogic';
import {
    buildRefreshStatusFromQueue,
    fetchRefreshQueueSnapshot,
    getTotalRefreshPendingCount
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
                const pendingCount = getTotalRefreshPendingCount(queueState);

                if (pendingCount <= 0) {
                    setRefreshState((prev) => {
                        if (!prev.isRefreshing) return prev;
                        return {
                            isRefreshing: false,
                            progress: 100,
                            status: 'Dados agregados, Dashboard e UTR atualizados.'
                        };
                    });
                    return;
                }

                setRefreshState(buildRefreshStatusFromQueue(queueState));

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
