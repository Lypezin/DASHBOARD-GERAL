
import { useMVRefreshLogic } from '@/hooks/upload/useMVRefreshLogic';

export function useAutoRefresh() {
    const { refreshState, triggerRefresh } = useMVRefreshLogic();

    return {
        startAutoRefresh: triggerRefresh,
        isRefreshing: refreshState.isRefreshing,
        refreshProgress: refreshState.progress,
        refreshStatus: refreshState.status
    };
}
