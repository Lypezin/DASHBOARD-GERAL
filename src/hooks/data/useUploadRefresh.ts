import { useAutoRefresh } from './useAutoRefresh';
import { useManualRefresh } from './useManualRefresh';

/**
 * Hook para gerenciar refresh de Materialized Views
 */
export function useUploadRefresh() {
  const { startAutoRefresh, isRefreshing, refreshProgress, refreshStatus } = useAutoRefresh();
  const { state, refreshAllMVs, retryFailedMVs } = useManualRefresh();

  return {
    ...state,
    startAutoRefresh,
    isRefreshing,
    refreshProgress,
    refreshStatus,
    refreshAllMVs,
    retryFailedMVs,
  };
}
