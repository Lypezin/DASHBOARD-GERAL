import { useState } from 'react';
import { useDashboardKeys } from './useDashboardKeys';
import { useDashboardFilters } from './useDashboardFilters';
import { useChartRegistration } from './useChartRegistration';
import { useDashboardAuthWrapper } from './useDashboardAuthWrapper';
import { useDashboardTabs } from './useDashboardTabs';
import { useDashboardDimensions } from './useDashboardDimensions';
import { useDashboardCache } from './useDashboardCache';
import { useDashboardFilterOptions } from './useDashboardFilterOptions';

export function useDashboardPage() {
  const { isCheckingAuth, isAuthenticated, currentUser } = useDashboardAuthWrapper();
  const chartReady = useChartRegistration();
  const { activeTab, handleTabChange } = useDashboardTabs();

  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const { filters, setFilters } = useDashboardFilters();

  const { filterPayload } = useDashboardKeys(filters, currentUser);
  
  // As dimensões básicas (anos/semanas disponíveis) são carregadas uma vez no mount
  const { anosDisponiveis, semanasDisponiveis } = useDashboardDimensions();
  
  // Tentar pegar as outras dimensões (praças, sub-praças, etc) do cache se já foram carregadas por alguma aba
  const { getCacheData } = useDashboardCache();
  const cachedData = getCacheData();
  const dimensoes = cachedData?.dimensoes || null;

  // Gerar as opções dos filtros baseadas nas dimensões (do cache ou fallbacks)
  const filterOptions = useDashboardFilterOptions({
    dimensoes,
    currentUser,
    filters
  });

  return {
    auth: { isCheckingAuth, isAuthenticated, currentUser },
    ui: { activeTab, handleTabChange, chartReady, loading: false, error: null },
    filters: {
      state: filters,
      setState: setFilters,
      payload: filterPayload,
      options: { 
        anos: anosDisponiveis, 
        semanas: semanasDisponiveis, 
        ...filterOptions 
      },
    },
    anoEvolucao: {
      valor: anoEvolucao,
      set: setAnoEvolucao
    }
  };
}
