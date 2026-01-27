/**
 * Hook para gerenciar estado principal da página do dashboard
 * Extraído de src/app/page.tsx para melhor organização
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useTabData } from '@/hooks/useTabData';
import { useTabDataMapper } from '@/hooks/useTabDataMapper';
import { useDashboardKeys } from '@/hooks/dashboard/useDashboardKeys';
import { useUserActivity } from '@/hooks/useUserActivity';
import { TabType } from '@/types';
import { useDashboardFilters } from './useDashboardFilters';
import { useEvolutionAutoSelect } from './useEvolutionAutoSelect';
import { useChartRegistration } from './dashboard/useChartRegistration';
import { useDashboardAuthWrapper } from './dashboard/useDashboardAuthWrapper';

export function useDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auth Logic
  const { isCheckingAuth, isAuthenticated, currentUser } = useDashboardAuthWrapper();

  // Chart Registration
  const chartReady = useChartRegistration();

  // Initialize activeTab from URL or default to 'dashboard'
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get('tab');
    // Validate if param is a valid TabType (simple validation)
    if (tabParam && ['dashboard', 'analise', 'utr', 'entregadores', 'valores', 'evolucao', 'prioridade', 'comparacao', 'marketing', 'marketing_comparacao'].includes(tabParam)) {
      return tabParam as TabType;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());

  const { filters, setFilters } = useDashboardFilters();

  // Sync activeTab with URL
  const setActiveTab = useCallback((newTab: TabType) => {
    setActiveTabState(newTab);

    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'dashboard') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(url, { scroll: false });
  }, [pathname, router, searchParams]);

  // Update activeTab if URL changes externally (e.g. back button)
  useEffect(() => {
    const urlTab = getInitialTab();
    if (urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, [searchParams]);

  // 1. Obter dados (incluindo anosDisponiveis)
  const {
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    anosDisponiveis,
    semanasDisponiveis,
    pracas,
    subPracas,
    origens,
    turnos,
    loading,
    error,
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loadingEvolucao,
    aderenciaGeral
  } = useDashboardData(filters, activeTab, anoEvolucao, currentUser);

  // 2. Usar o hook de lógica de evolução (não controla estado, apenas side-effects)
  useEvolutionAutoSelect({
    filters,
    setFilters,
    anosDisponiveis: anosDisponiveis || [],
    anoEvolucao,
    setAnoEvolucao
  });

  // Reutilizar lógica centralizada de chaves e payload
  const { filterPayload } = useDashboardKeys(filters, currentUser);

  const { data: tabData, loading: loadingTabData } = useTabData(activeTab, filterPayload, currentUser);

  // Mapeia os dados do useTabData para as props dos componentes de view
  const { utrData, entregadoresData, valoresData, prioridadeData } = useTabDataMapper({
    activeTab,
    tabData,
  });

  useUserActivity(activeTab, filters, currentUser);

  // Função para mudar de aba
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const dashboardData = {
    aderenciaGeral,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    totals,
  };

  return {
    auth: {
      isCheckingAuth,
      isAuthenticated,
      currentUser,
    },
    ui: {
      activeTab,
      handleTabChange,
      chartReady,
      loading,
      error,
    },
    filters: {
      state: filters,
      setState: setFilters,
      options: {
        anos: anosDisponiveis,
        semanas: semanasDisponiveis,
        pracas,
        subPracas,
        origens,
        turnos,
      },
    },
    data: {
      dashboard: dashboardData,
      tabs: {
        utrData,
        entregadoresData,
        valoresData,
        prioridadeData,
        loading: loadingTabData,
      },
      evolution: {
        mensal: evolucaoMensal,
        semanal: evolucaoSemanal,
        loading: loadingEvolucao,
        anoSelecionado: anoEvolucao,
        setAno: setAnoEvolucao,
        anosOptions: anosDisponiveis,
      },
    },
  };
}
