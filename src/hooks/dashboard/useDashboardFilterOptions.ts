/**
 * Hook para buscar opções de filtros do dashboard
 * Re-exporta lógica separada em hooks modularizados
 */

import { CurrentUser, DimensoesDashboard, Filters } from '@/types';
import { usePracaOptions } from '../filters/usePracaOptions';
import { useDimensionOptions } from '../filters/useDimensionOptions';

interface UseDashboardFiltersOptions {
  dimensoes: DimensoesDashboard | null;
  currentUser?: CurrentUser | null;
  filters?: Filters | null;
  organizationId?: string | null;
  dimensionsLoading?: boolean;
  dimensionsError?: string | null;
  retryDimensions?: () => void;
}

export function useDashboardFilterOptions(options: UseDashboardFiltersOptions) {
  const { dimensoes, currentUser, filters, organizationId } = options;

  const pracas = usePracaOptions(dimensoes, currentUser, filters);
  const dimensions = useDimensionOptions(currentUser, filters, organizationId);

  const retryOptions = () => {
    options.retryDimensions?.();
    dimensions.retry();
  };

  return {
    pracas,
    subPracas: dimensions.subPracas,
    origens: dimensions.origens,
    turnos: dimensions.turnos,
    optionsLoading: Boolean(options.dimensionsLoading || dimensions.loading),
    optionsError: options.dimensionsError || dimensions.error,
    retryOptions,
  };
}
