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
import { useDashboardCache, getInitialCacheData } from './useDashboardCache';
import { useDashboardDataEffect } from './dashboard/useDashboardDataEffect';
import { useOrganization } from '@/contexts/OrganizationContext';

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
  const { isLoading: isOrgLoading } = useOrganization();

  // Inicializar estados com dados do cache global para evitar "refresh" ao voltar para a aba
  const initialCache = getInitialCacheData();

  // Converter totais do cache para o tipo Totals usado no componente
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
  const [dimensoes, setDimensoes] = useState<DimensoesDashboard | null>(initialCache?.dimensoes ?? null);

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
    isOrgLoading,
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
    dimensoes,
    loading: loading || isOrgLoading,
    error,
  };
}
