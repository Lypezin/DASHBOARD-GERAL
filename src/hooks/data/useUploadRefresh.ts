import { useManualRefresh } from '@/hooks/useManualRefresh';

/**
 * Hook para gerenciar refresh de Materialized Views
 */
export function useUploadRefresh() {
  const { state, refreshAllMVs, retryFailedMVs } = useManualRefresh();

  return {
    ...state,
    // Ignora argumentos para evitar erros de tipagem com o código existente 
    // e executa a atualização manual completa e confiável
    startAutoRefresh: (_force?: boolean) => refreshAllMVs(),
    isRefreshing: state.refreshing,
    refreshProgress: state.progress,
    refreshStatus: state.message,
    refreshAllMVs,
    retryFailedMVs,
  };
}
