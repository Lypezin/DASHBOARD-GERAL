import { useAutoRefresh } from './useAutoRefresh';
import { useManualRefresh } from './useManualRefresh';

/**
 * Hook para gerenciar refresh de Materialized Views
 */
export function useUploadRefresh() {
  const { startAutoRefresh } = useAutoRefresh();
  const { state, refreshAllMVs, retryFailedMVs } = useManualRefresh();

  return {
    ...state,
    startAutoRefresh,
    refreshAllMVs,
    retryFailedMVs,
  };
}
