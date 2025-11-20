/**
 * Hook para gerenciar dados do dashboard principal
 * Refatorado para usar hooks especializados
 */

import { useMemo } from 'react';
import {
  Filters, CurrentUser
} from '@/types';
import { buildFilterPayload } from '@/utils/helpers';
import { converterHorasParaDecimal } from '@/utils/formatters';
import { useDashboardDimensions } from './useDashboardDimensions';
import { useDashboardMainData } from './useDashboardMainData';
import { useDashboardEvolucao } from './useDashboardEvolucao';
import { useDashboardFilters } from './useDashboardFilters';

/**
 * Hook para gerenciar dados do dashboard principal
 * 
 * Busca e gerencia todos os dados necessários para o dashboard, incluindo:
 * - Totais (ofertadas, aceitas, rejeitadas, completadas)
 * - Aderência (semanal, diária, por turno, sub-praça, origem)
 * - Evolução (mensal e semanal)
 * - UTR semanal
 * - Opções de filtros (praças, sub-praças, origens, turnos)
 * 
 * @param {Filters} initialFilters - Filtros iniciais do dashboard
 * @param {string} activeTab - Aba ativa (usado para determinar quais dados carregar)
 * @param {number} anoEvolucao - Ano selecionado para visualização de evolução
 * @param {CurrentUser | null} [currentUser] - Usuário atual (para aplicar permissões)
 * @returns {Object} Objeto contendo todos os dados do dashboard, estados de loading e erro
 * 
 * @example
 * ```typescript
 * const {
 *   totals,
 *   aderenciaSemanal,
 *   loading,
 *   error
 * } = useDashboardData(filters, 'dashboard', 2024, currentUser);
 * ```
 */
export function useDashboardData(initialFilters: Filters, activeTab: string, anoEvolucao: number, currentUser?: CurrentUser | null) {
  const { anosDisponiveis, semanasDisponiveis } = useDashboardDimensions();

  const filterPayload = useMemo(() => {
    return buildFilterPayload(initialFilters, currentUser);
  }, [initialFilters, currentUser]);

  // Hook para dados principais
  const {
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    dimensoes,
    loading,
    error,
  } = useDashboardMainData({
    filterPayload,
    onError: (err) => {
      // Erro já tratado no hook
    },
  });

  // Hook para dados de evolução
  const {
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loading: loadingEvolucao,
  } = useDashboardEvolucao({
    filterPayload,
    anoEvolucao,
    activeTab,
  });

  // Hook para opções de filtros
  const {
    pracas,
    subPracas,
    origens,
    turnos,
  } = useDashboardFilters({
    dimensoes,
    currentUser,
  });

  // Calcular aderência geral
  const aderenciaGeral = useMemo(() => {
    if (aderenciaSemanal.length === 0) return undefined;
    if (aderenciaSemanal.length === 1) return aderenciaSemanal[0];
    
    const { totalHorasAEntregar, totalHorasEntregues } = aderenciaSemanal.reduce(
      (acc, semana) => ({
        totalHorasAEntregar: acc.totalHorasAEntregar + converterHorasParaDecimal(semana.horas_a_entregar || '0'),
        totalHorasEntregues: acc.totalHorasEntregues + converterHorasParaDecimal(semana.horas_entregues || '0')
      }),
      { totalHorasAEntregar: 0, totalHorasEntregues: 0 }
    );
    
    const aderenciaPercentual = totalHorasAEntregar > 0 
      ? (totalHorasEntregues / totalHorasAEntregar) * 100 
      : 0;
    
    return {
      semana_ano: 'Geral',
      horas_a_entregar: totalHorasAEntregar.toFixed(2),
      horas_entregues: totalHorasEntregues.toFixed(2),
      aderencia_percentual: aderenciaPercentual
    };
  }, [aderenciaSemanal]);

  return {
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
  };
}
