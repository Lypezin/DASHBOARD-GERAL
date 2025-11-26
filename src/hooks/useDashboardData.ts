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
import { safeLog } from '@/lib/errorHandler';
import { useDashboardDimensions } from './useDashboardDimensions';
import { useDashboardMainData } from './useDashboardMainData';
import { useDashboardEvolucao } from './useDashboardEvolucao';
import { useDashboardFilters } from './useDashboardFilters';

const IS_DEV = process.env.NODE_ENV === 'development';

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

  // Criar uma string estável dos filtros para usar como dependência
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      ano: initialFilters.ano,
      semana: initialFilters.semana,
      praca: initialFilters.praca,
      subPraca: initialFilters.subPraca,
      origem: initialFilters.origem,
      turno: initialFilters.turno,
      filtroModo: initialFilters.filtroModo,
      dataInicial: initialFilters.dataInicial,
      dataFinal: initialFilters.dataFinal,
    });
  }, [
    initialFilters.ano,
    initialFilters.semana,
    initialFilters.praca,
    initialFilters.subPraca,
    initialFilters.origem,
    initialFilters.turno,
    initialFilters.filtroModo,
    initialFilters.dataInicial,
    initialFilters.dataFinal,
  ]);

  const currentUserKey = useMemo(() => {
    return currentUser ? JSON.stringify({
      is_admin: currentUser.is_admin,
      assigned_pracas: currentUser.assigned_pracas,
    }) : 'null';
  }, [currentUser?.is_admin, currentUser?.assigned_pracas?.join(',')]);

  const filterPayload = useMemo(() => {
    if (IS_DEV) {
      safeLog.info('[useDashboardData] Gerando filterPayload:', {
        initialFilters,
        initialFiltersAno: initialFilters.ano,
        initialFiltersSemana: initialFilters.semana,
        currentUser: currentUser ? { is_admin: currentUser.is_admin } : null,
      });
    }
    const payload = buildFilterPayload(initialFilters, currentUser);

    if (IS_DEV) {
      safeLog.info('[useDashboardData] filterPayload gerado:', {
        payload,
        p_ano: payload.p_ano,
        p_semana: payload.p_semana,
      });
    }
    return payload;
    // Usar apenas as chaves estáveis, não os objetos completos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, currentUserKey]);

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
