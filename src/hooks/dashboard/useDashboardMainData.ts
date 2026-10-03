/** Hook para buscar dados principais do dashboard */

import { useCallback, useState, useMemo, useRef } from 'react';
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
import { createRequestKey } from '@/utils/request/createRequestKey';

interface UseDashboardMainDataOptions {
  filterPayload: FilterPayload;
  filterPayloadKey?: string;
  accessScopeKey: string;
  onError?: (error: Error | RpcError) => void;
  enabled?: boolean;
}

export function useDashboardMainData(options: UseDashboardMainDataOptions) {
  const { filterPayload, filterPayloadKey, accessScopeKey, onError, enabled = true } = options;
  const { isLoading: isOrgLoading } = useOrganization();

  const payloadKey = useMemo(
    () => createRequestKey({
      accessScopeKey,
      filterPayloadKey: filterPayloadKey || createRequestKey(filterPayload),
    }),
    [accessScopeKey, filterPayload, filterPayloadKey]
  );
  const hasOrganizationContext = useMemo(
    () => typeof filterPayload.p_organization_id === 'string' && filterPayload.p_organization_id.trim().length > 0,
    [filterPayload.p_organization_id]
  );
  const currentOrganizationId = typeof filterPayload.p_organization_id === 'string'
    ? filterPayload.p_organization_id.trim()
    : null;

  const initialCacheRef = useRef<ReturnType<typeof getInitialCacheData>>();
  if (initialCacheRef.current === undefined) {
    initialCacheRef.current = getInitialCacheData(payloadKey);
  }
  const initialCache = initialCacheRef.current;
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
  const [resolvedPayloadKey, setResolvedPayloadKey] = useState<string | null>(initialCache ? payloadKey : null);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(initialCache ? currentOrganizationId : null);
  const [dataScopeKey, setDataScopeKey] = useState<string | null>(initialCache ? accessScopeKey : null);

  const { fetchDashboardData, loading, error } = useDashboardDataFetcher({ onError, payloadKey });
  const { checkCache, updateCache, clearCache, previousPayloadRef, isFirstExecutionRef, pendingPayloadKeyRef } = useDashboardCache();
  const [retryNonce, setRetryNonce] = useState(0);
  const retryMainData = useCallback(() => {
    previousPayloadRef.current = '';
    pendingPayloadKeyRef.current = '';
    setResolvedPayloadKey(null);
    setRetryNonce((current) => current + 1);
  }, [pendingPayloadKeyRef, previousPayloadRef]);

  const setters = useMemo(() => ({
    setTotals,
    setAderenciaSemanal,
    setAderenciaDia,
    setAderenciaTurno,
    setAderenciaSubPraca,
    setAderenciaOrigem,
    setAderenciaDiaOrigem,
    setDimensoes
  }), []);

  useDashboardDataEffect({
    filterPayload,
    fetchDashboardData,
    checkCache,
    updateCache,
    clearCache,
    previousPayloadRef,
    isFirstExecutionRef,
    pendingPayloadKeyRef,
    setDataOrganizationId,
    setDataScopeKey,
    accessScopeKey,
    setters,
    setResolvedPayloadKey,
    retryNonce,
    shouldFetch: enabled && !isOrgLoading && hasOrganizationContext
  }, payloadKey);

  const canShowCurrentScopeData = dataOrganizationId === currentOrganizationId && dataScopeKey === accessScopeKey;

  return {
    totals: canShowCurrentScopeData ? totals : null,
    aderenciaSemanal: canShowCurrentScopeData ? aderenciaSemanal : [],
    aderenciaDia: canShowCurrentScopeData ? aderenciaDia : [],
    aderenciaTurno: canShowCurrentScopeData ? aderenciaTurno : [],
    aderenciaSubPraca: canShowCurrentScopeData ? aderenciaSubPraca : [],
    aderenciaOrigem: canShowCurrentScopeData ? aderenciaOrigem : [],
    aderenciaDiaOrigem: canShowCurrentScopeData ? aderenciaDiaOrigem : [],
    dimensoes: canShowCurrentScopeData ? dimensoes : null,
    loading: enabled && (loading || isOrgLoading || !hasOrganizationContext || resolvedPayloadKey !== payloadKey),
    error: enabled && resolvedPayloadKey === payloadKey ? error : null,
    retryMainData,
  };
}
