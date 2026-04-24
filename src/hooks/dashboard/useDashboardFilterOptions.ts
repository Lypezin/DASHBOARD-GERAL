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
}

export function useDashboardFilterOptions(options: UseDashboardFiltersOptions) {
  const { dimensoes, currentUser, filters, organizationId } = options;

  const pracas = usePracaOptions(dimensoes, currentUser, filters);
  const { subPracas, origens, turnos } = useDimensionOptions(dimensoes, currentUser, filters, organizationId);

  return {
    pracas,
    subPracas,
    origens,
    turnos,
  };
}
