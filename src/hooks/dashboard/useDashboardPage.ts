import { useEffect, useMemo, useState } from 'react';
import { useDashboardKeys } from './useDashboardKeys';
import { useDashboardFilters } from './useDashboardFilters';
import { useChartRegistration } from './useChartRegistration';
import { useDashboardAuthWrapper } from './useDashboardAuthWrapper';
import { useDashboardTabs } from './useDashboardTabs';
import { useDashboardDimensions, writeCachedDimensions } from './useDashboardDimensions';
import { useDashboardFilterOptions } from './useDashboardFilterOptions';
import { useDashboardMainData } from './useDashboardMainData';

export function useDashboardPage() {
  const { isCheckingAuth, isAuthenticated, currentUser } = useDashboardAuthWrapper();
  const chartReady = useChartRegistration();
  const { activeTab, handleTabChange } = useDashboardTabs();

  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const { filters, setFilters } = useDashboardFilters();

  const { filterPayload, filterPayloadKey } = useDashboardKeys(filters, currentUser);
  const { anosDisponiveis, semanasDisponiveis, dimensoes } = useDashboardDimensions({ fetchRemote: false });
  const mainData = useDashboardMainData({ filterPayload, filterPayloadKey });

  useEffect(() => {
    if (
      mainData.dimensoes &&
      (
        mainData.dimensoes.anos.length > 0 ||
        mainData.dimensoes.semanas.length > 0 ||
        mainData.dimensoes.pracas.length > 0 ||
        mainData.dimensoes.sub_pracas.length > 0 ||
        mainData.dimensoes.origens.length > 0 ||
        (mainData.dimensoes.turnos?.length || 0) > 0
      )
    ) {
      writeCachedDimensions(mainData.dimensoes);
    }
  }, [mainData.dimensoes]);

  const anosDisponiveisFinais = useMemo(() => {
    const mainYears = mainData.dimensoes?.anos || [];
    return mainYears.length > 0 ? mainYears : anosDisponiveis;
  }, [mainData.dimensoes?.anos, anosDisponiveis]);

  const semanasDisponiveisFinais = useMemo(() => {
    const mainWeeks = mainData.dimensoes?.semanas || [];
    return mainWeeks.length > 0 ? mainWeeks : semanasDisponiveis;
  }, [mainData.dimensoes?.semanas, semanasDisponiveis]);

  const filterOptions = useDashboardFilterOptions({
    dimensoes: mainData.dimensoes || dimensoes,
    currentUser,
    filters,
    organizationId: filterPayload.p_organization_id
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
