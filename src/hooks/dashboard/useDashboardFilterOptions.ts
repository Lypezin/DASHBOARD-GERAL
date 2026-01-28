/**
 * Hook para buscar opções de filtros do dashboard
 * Re-exporta lógica separada em hooks modularizados
 */

import { CurrentUser, DimensoesDashboard } from '@/types';
import { usePracaOptions } from '../filters/usePracaOptions';
import { useDimensionOptions } from '../filters/useDimensionOptions';

interface UseDashboardFiltersOptions {
  dimensoes: DimensoesDashboard | null;
  currentUser?: CurrentUser | null;
}

export function useDashboardFilterOptions(options: UseDashboardFiltersOptions) {
  const { dimensoes, currentUser } = options;

  const pracas = usePracaOptions(dimensoes, currentUser);
  const { subPracas, origens, turnos } = useDimensionOptions(dimensoes, currentUser);

  return {
    pracas,
    subPracas,
    origens,
    turnos,
  };
}
