import { useState } from 'react';
import { useDashboardKeys } from './useDashboardKeys';
import { useDashboardFilters } from './useDashboardFilters';
import { useChartRegistration } from './useChartRegistration';
import { useDashboardAuthWrapper } from './useDashboardAuthWrapper';
import { useDashboardTabs } from './useDashboardTabs';
import { useDashboardDimensions } from './useDashboardDimensions';
import { useDashboardFilterOptions } from './useDashboardFilterOptions';
import { useDashboardMainData } from './useDashboardMainData';

export function useDashboardPage() {
  const { isCheckingAuth, isAuthenticated, currentUser } = useDashboardAuthWrapper();
  const chartReady = useChartRegistration();
  const { activeTab, handleTabChange } = useDashboardTabs();

  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const { filters, setFilters } = useDashboardFilters();

  const { filterPayload } = useDashboardKeys(filters, currentUser);
  
  // As dimensões básicas são carregadas uma vez no mount (Anos, Semanas, Praças, etc)
  const { anosDisponiveis, semanasDisponiveis, dimensoes } = useDashboardDimensions();
  
  // Para manter a performance e compatibilidade, carregamos os dados principais centralmente
  // Isso povoa o cache global que as sub-views usarão se necessário
  const mainData = useDashboardMainData({ filterPayload });

  // Gerar as opções dos filtros baseadas nas dimensões carregadas globalmente ou no mainData
  const filterOptions = useDashboardFilterOptions({
    dimensoes: mainData.dimensoes || dimensoes,
    currentUser,
    filters
  });

  return {
    auth: { isCheckingAuth, isAuthenticated, currentUser },
    ui: { activeTab, handleTabChange, chartReady, loading: mainData.loading, error: mainData.error },
    data: mainData,
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
