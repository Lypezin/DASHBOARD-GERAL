import { useEffect, useMemo, useState } from 'react';
import { useDashboardKeys } from './useDashboardKeys';
import { useDashboardFilters } from './useDashboardFilters';
import { useChartRegistration } from './useChartRegistration';
import { useDashboardAuthWrapper } from './useDashboardAuthWrapper';
import { useDashboardTabs } from './useDashboardTabs';
import { DEFAULT_YEARS, useDashboardDimensions } from './useDashboardDimensions';
import { useDashboardFilterOptions } from './useDashboardFilterOptions';
import { useDashboardMainData } from './useDashboardMainData';
import { createRequestKey } from '@/utils/request/createRequestKey';

export function useDashboardPage() {
  const { isCheckingAuth, isAuthenticated, hasSessionWithoutProfile, hasMissingOrganization, error: authError, refresh: refreshAuth, currentUser } = useDashboardAuthWrapper();
  const { activeTab, handleTabChange } = useDashboardTabs();
  const needsChartRuntime = ['evolucao', 'comparacao'].includes(activeTab);
  const chartReady = useChartRegistration(needsChartRuntime);

  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const { filters, setFilters } = useDashboardFilters();

  const { filterPayload, filterPayloadKey } = useDashboardKeys(filters, currentUser);
  const needsMainDashboardData = activeTab === 'dashboard' || activeTab === 'analise';
  const dimensionCacheScopeKey = useMemo(() => createRequestKey({
    organizationId: filterPayload.p_organization_id || null,
    userId: currentUser?.id || null,
    role: currentUser?.role || null,
    isAdmin: currentUser?.is_admin || false,
    assignedPracas: [...(currentUser?.assigned_pracas || [])].sort(),
  }), [currentUser?.assigned_pracas, currentUser?.id, currentUser?.is_admin, currentUser?.role, filterPayload.p_organization_id]);
  const { anosDisponiveis, semanasDisponiveis, dimensoes, loadingDimensions, dimensionsError, retryDimensions } = useDashboardDimensions({
    fetchRemote: true,
    cacheScopeKey: dimensionCacheScopeKey,
    organizationId: filterPayload.p_organization_id,
  });
  const mainData = useDashboardMainData({ filterPayload, filterPayloadKey, accessScopeKey: dimensionCacheScopeKey, enabled: needsMainDashboardData });

  useEffect(() => {
    if (typeof filters.ano === 'number' && filters.ano !== anoEvolucao) {
      setAnoEvolucao(filters.ano);
    }
  }, [anoEvolucao, filters.ano]);

  const anosDisponiveisFinais = useMemo(() => {
    const mainYears = mainData.dimensoes?.anos || [];
    const mergedYears = Array.from(new Set([...anosDisponiveis, ...mainYears]))
      .filter((ano) => Number.isFinite(ano))
      .sort((a, b) => b - a);

    return mergedYears.length > 0 ? mergedYears : DEFAULT_YEARS;
  }, [mainData.dimensoes?.anos, anosDisponiveis]);

  const semanasDisponiveisFinais = useMemo(() => {
    const mainWeeks = mainData.dimensoes?.semanas || [];
    return mainWeeks.length > 0 ? mainWeeks : semanasDisponiveis;
  }, [mainData.dimensoes?.semanas, semanasDisponiveis]);

  const filterOptions = useDashboardFilterOptions({
    // dashboard_resumo returns dimensions already filtered by the active selection;
    // use the independently loaded list for filter choices so it stays complete.
    dimensoes: dimensoes || mainData.dimensoes,
    currentUser,
    filters,
    organizationId: filterPayload.p_organization_id,
    dimensionsLoading: loadingDimensions,
    dimensionsError,
    retryDimensions,
  });

  return {
    auth: { isCheckingAuth, isAuthenticated, hasSessionWithoutProfile, hasMissingOrganization, error: authError, refresh: refreshAuth, currentUser },
    ui: { activeTab, handleTabChange, chartReady, loading: mainData.loading, error: mainData.error },
    data: mainData,
    filters: {
      state: filters,
      setState: setFilters,
      payload: filterPayload,
      optionsLoading: filterOptions.optionsLoading,
      optionsError: filterOptions.optionsError,
      retryOptions: filterOptions.retryOptions,
      options: {
        anos: anosDisponiveisFinais,
        semanas: semanasDisponiveisFinais,
        ...filterOptions
      },
    },
    anoEvolucao: {
      valor: anoEvolucao,
      set: setAnoEvolucao
    }
  };
}
