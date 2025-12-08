/**
 * Hook para buscar dados principais do dashboard
 * Separa lógica de busca de dados principais (totais, aderências)
 */

import { useState, useMemo } from 'react';
import {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  DimensoesDashboard,
} from '@/types';
import { useDashboardDataFetcher } from './useDashboardDataFetcher';
import { useDashboardCache } from './useDashboardCache';
import { useDashboardDataEffect } from './dashboard/useDashboardDataEffect';

import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface UseDashboardMainDataOptions {
  filterPayload: FilterPayload;
  onError?: (error: Error | RpcError) => void;
}

/**
 * Hook para buscar dados principais do dashboard
 */
export function useDashboardMainData(options: UseDashboardMainDataOptions) {
  const { filterPayload, onError } = options;

  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>([]);
  const [dimensoes, setDimensoes] = useState<DimensoesDashboard | null>(null);

  const { fetchDashboardData, loading, error } = useDashboardDataFetcher({ filterPayload, onError });

  const {
    checkCache,
    updateCache,
    clearCache,
    previousPayloadRef,
    isFirstExecutionRef,
    pendingPayloadKeyRef
  } = useDashboardCache();

  // Criar uma string estável do payload para usar como dependência
  const payloadKey = useMemo(() => JSON.stringify(filterPayload), [
    filterPayload.p_ano,
    filterPayload.p_semana,
    filterPayload.p_praca,
    filterPayload.p_sub_praca,
    filterPayload.p_origem,
    filterPayload.p_turno,
    filterPayload.p_data_inicial,
    filterPayload.p_data_final,
    filterPayload.p_organization_id,
    JSON.stringify(filterPayload.p_sub_pracas),
    JSON.stringify(filterPayload.p_origens),
    JSON.stringify(filterPayload.p_turnos),
  ]);

  // Usar o hook de efeito extraído
  useDashboardDataEffect({
    filterPayload,
    fetchDashboardData,
    checkCache,
    updateCache,
    clearCache,
    previousPayloadRef,
    isFirstExecutionRef,
    pendingPayloadKeyRef,
    setters: {
      setTotals,
      setAderenciaSemanal,
      setAderenciaDia,
      setAderenciaTurno,
      setAderenciaSubPraca,
      setAderenciaOrigem,
      setDimensoes
    }
  }, payloadKey);

  return {
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    dimensoes,
    loading,
    error,
  };
}
