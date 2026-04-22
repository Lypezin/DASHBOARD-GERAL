/** Hook para buscar dados principais do dashboard */

import { useState, useMemo } from 'react';
import type {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  AderenciaDiaOrigem,
  DimensoesDashboard,
} from '@/types';
import { useDashboardDataFetcher } from './useDashboardDataFetcher';
import { useDashboardCache, getInitialCacheData } from './useDashboardCache';
import { useDashboardDataEffect } from './useDashboardDataEffect';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface UseDashboardMainDataOptions {
  filterPayload: FilterPayload;
  onError?: (error: Error | RpcError) => void;
}

export function useDashboardMainData(options: UseDashboardMainDataOptions) {
  const { filterPayload, onError } = options;
  const { isLoading: isOrgLoading } = useOrganization();

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
    isOrgLoading,
    JSON.stringify(filterPayload.p_sub_pracas),
    JSON.stringify(filterPayload.p_origens),
    JSON.stringify(filterPayload.p_turnos),
  ]);

  const initialCache = getInitialCacheData(payloadKey);
  const cachedTotals: Totals | null = initialCache?.totais ? {
    ofertadas: initialCache.totais.corridas_ofertadas,
    aceitas: initialCache.totais.corridas_aceitas,
    rejeitadas: initialCache.totais.corridas_rejeitadas,
    completadas: initialCache.totais.corridas_completadas,
  } : null;

  const [totals, setTotals] = useState<Totals | null>(cachedTotals);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>(initialCache?.aderencia_semanal ?? []);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>(initialCache?.aderencia_dia ?? []);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>(initialCache?.aderencia_turno ?? []);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>(initialCache?.aderencia_sub_praca ?? []);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>(initialCache?.aderencia_origem ?? []);
  const [aderenciaDiaOrigem, setAderenciaDiaOrigem] = useState<AderenciaDiaOrigem[]>(initialCache?.aderencia_dia_origem ?? []);
  const [dimensoes, setDimensoes] = useState<DimensoesDashboard | null>(initialCache?.dimensoes ?? null);

  const { fetchDashboardData, loading, error } = useDashboardDataFetcher({ filterPayload, onError });
  const { checkCache, updateCache, clearCache, previousPayloadRef, isFirstExecutionRef, pendingPayloadKeyRef } = useDashboardCache();

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
      setAderenciaDiaOrigem,
      setDimensoes
    },
    shouldFetch: !isOrgLoading
  }, payloadKey);

  return {
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    aderenciaDiaOrigem,
    dimensoes,
    loading: loading || isOrgLoading,
    error
  };
}
