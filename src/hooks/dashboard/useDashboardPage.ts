import { useState } from 'react';
import { useDashboardData } from './useDashboardData';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { useDashboardKeys } from './useDashboardKeys';
import { useDashboardFilters } from './useDashboardFilters';
import { useEvolutionAutoSelect } from '@/hooks/data/useEvolutionAutoSelect';
import { useChartRegistration } from './useChartRegistration';
import { useDashboardAuthWrapper } from './useDashboardAuthWrapper';
import { useDashboardTabs } from './useDashboardTabs';

export function useDashboardPage() {
  const { isCheckingAuth, isAuthenticated, currentUser } = useDashboardAuthWrapper();
  const chartReady = useChartRegistration();
  const { activeTab, handleTabChange } = useDashboardTabs();

  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const { filters, setFilters } = useDashboardFilters();

  const dashboardFetch = useDashboardData(filters, activeTab, anoEvolucao, currentUser);
  const { anosDisponiveis, semanasDisponiveis, pracas, subPracas, origens, turnos } = dashboardFetch;

  useEvolutionAutoSelect({ filters, setFilters, anosDisponiveis: anosDisponiveis || [], anoEvolucao, setAnoEvolucao });

  const { filterPayload } = useDashboardKeys(filters, currentUser);
  const { data: tabData, loading: loadingTabData } = useTabData(activeTab, filterPayload, currentUser);
  const { utrData, entregadoresData, valoresData, prioridadeData } = useTabDataMapper({ activeTab, tabData });

  const dashboardData = {
    aderenciaGeral: dashboardFetch.aderenciaGeral,
    aderenciaSemanal: dashboardFetch.aderenciaSemanal,
    aderenciaDia: dashboardFetch.aderenciaDia,
    aderenciaTurno: dashboardFetch.aderenciaTurno,
    aderenciaSubPraca: dashboardFetch.aderenciaSubPraca,
    aderenciaOrigem: dashboardFetch.aderenciaOrigem,
    aderenciaDiaOrigem: dashboardFetch.aderenciaDiaOrigem,
    totals: dashboardFetch.totals,
  };

  return {
    auth: { isCheckingAuth, isAuthenticated, currentUser },
    ui: { activeTab, handleTabChange, chartReady, loading: dashboardFetch.loading, error: dashboardFetch.error },
    filters: {
      state: filters,
      setState: setFilters,
      payload: filterPayload,
      options: { anos: anosDisponiveis, semanas: semanasDisponiveis, pracas, subPracas, origens, turnos },
    },
    data: {
      dashboard: dashboardData,
      tabs: { utrData, entregadoresData, valoresData, prioridadeData, loading: loadingTabData },
      evolution: {
        mensal: dashboardFetch.evolucaoMensal,
        semanal: dashboardFetch.evolucaoSemanal,
        utrSemanal: dashboardFetch.utrSemanal,
        loading: dashboardFetch.loadingEvolucao,
        anoSelecionado: anoEvolucao,
        setAno: setAnoEvolucao,
        anosOptions: anosDisponiveis,
      },
    },
  };
}
