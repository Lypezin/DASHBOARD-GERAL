import { useMemo } from 'react';
import { Filters, CurrentUser } from '@/types';
import { useDashboardDimensions } from './useDashboardDimensions';
import { useDashboardMainData } from './useDashboardMainData';
import { useDashboardEvolucao } from './useDashboardEvolucao';
import { useDashboardFilterOptions } from './useDashboardFilterOptions';
import { useDashboardKeys } from './useDashboardKeys';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';

export function useDashboardData(initialFilters: Filters, activeTab: string, anoEvolucao: number, currentUser?: CurrentUser | null) {
  const { anosDisponiveis, semanasDisponiveis } = useDashboardDimensions();
  const { filterPayload } = useDashboardKeys(initialFilters, currentUser);

  const {
    totals, aderenciaSemanal, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem, dimensoes, loading, error,
  } = useDashboardMainData({ filterPayload });

  const {
    evolucaoMensal, evolucaoSemanal, utrSemanal, loading: loadingEvolucao,
  } = useDashboardEvolucao({ filterPayload, anoEvolucao, activeTab });

  const {
    pracas, subPracas, origens, turnos,
  } = useDashboardFilterOptions({ dimensoes, currentUser });

  const aderenciaGeral = useMemo(() => calculateAderenciaGeral(aderenciaSemanal), [aderenciaSemanal]);

  return {
    totals, aderenciaSemanal, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem,
    anosDisponiveis, semanasDisponiveis, pracas, subPracas, origens, turnos,
    loading, error,
    evolucaoMensal, evolucaoSemanal, utrSemanal, loadingEvolucao,
    aderenciaGeral
  };
}
