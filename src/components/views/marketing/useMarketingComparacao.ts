import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurrentUser } from '@/types';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import { getTimedCacheValue, setTimedCacheValue, type TimedCacheEntry } from '@/utils/cache/timedLruCache';

export interface MarketingComparisonData {
  semana_iso: string;
  segundos_ops: number;
  segundos_mkt: number;
  ofertadas_ops: number;
  ofertadas_mkt: number;
  aceitas_ops: number;
  aceitas_mkt: number;
  concluidas_ops: number;
  concluidas_mkt: number;
  rejeitadas_ops: number;
  rejeitadas_mkt: number;
  valor_ops: number;
  valor_mkt: number;
  entregadores_ops: number;
  entregadores_mkt: number;
}

const COMPARISON_CACHE_POLICY = { ttlMs: 5 * 60 * 1000, maxEntries: 12 } as const;
const comparisonCache = new Map<string, TimedCacheEntry<MarketingComparisonData[]>>();
const comparisonRequests = new Map<string, Promise<MarketingComparisonData[]>>();

function buildCacheKey(dataInicial: string, dataFinal: string, organizationId: string, praca: string | null, accessScopeKey: string) {
  return `${accessScopeKey}|${organizationId}|${praca || 'all'}|${dataInicial}|${dataFinal}`;
}

function getCachedValue(cacheKey: string) {
  return getTimedCacheValue(comparisonCache, cacheKey, COMPARISON_CACHE_POLICY);
}

async function fetchMarketingComparison(cacheKey: string, params: Record<string, unknown>) {
  const activeRequest = comparisonRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data: result, error: rpcError } = await safeRpc<MarketingComparisonData[]>(
      'get_marketing_comparison_weekly',
      params,
      { validateParams: false, timeout: 60000 }
    );

    if (rpcError) {
      throw rpcError;
    }

    if (!Array.isArray(result)) {
      throw new Error('A consulta de comparação do Marketing retornou uma resposta inválida.');
    }

    const normalized = result;
    setTimedCacheValue(comparisonCache, cacheKey, normalized, COMPARISON_CACHE_POLICY);

    return normalized;
  })().finally(() => {
    comparisonRequests.delete(cacheKey);
  });

  comparisonRequests.set(cacheKey, request);
  return request;
}

export function useMarketingComparacao(dataInicial: string, dataFinal: string, organizationId: string | undefined, praca: string | null, currentUser: CurrentUser | null) {
  const [data, setData] = useState<MarketingComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCacheKey, setResolvedCacheKey] = useState<string | null>(null);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [dataAccessScopeKey, setDataAccessScopeKey] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const hasVisibleDataRef = useRef(false);
  const accessScopeKey = createAccessScopeKey(currentUser, organizationId);
  const currentCacheKey = dataInicial && dataFinal && organizationId
    ? buildCacheKey(dataInicial, dataFinal, organizationId, praca, accessScopeKey)
    : null;
  hasVisibleDataRef.current = dataOrganizationId === (organizationId || null)
    && dataAccessScopeKey === accessScopeKey
    && data.length > 0;

  const fetchData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    if (!dataInicial || !dataFinal || !organizationId || !currentCacheKey) {
      setData([]);
      setError(null);
      setLoading(false);
      setResolvedCacheKey(null);
      setDataOrganizationId(null);
      setDataAccessScopeKey(null);
      return;
    }

    const cacheKey = currentCacheKey;
    const cached = getCachedValue(cacheKey);

    if (cached) {
      setData(cached);
      setResolvedCacheKey(cacheKey);
      setDataOrganizationId(organizationId);
      setDataAccessScopeKey(accessScopeKey);
      setError(null);
      setLoading(false);
      return;
    }

    const hasVisibleData = hasVisibleDataRef.current;

    try {
      setLoading(true);
      setError(null);

      const params = {
        data_inicial: dataInicial,
        data_final: dataFinal,
        p_organization_id: organizationId,
        p_praca: praca
      };

      const result = await fetchMarketingComparison(cacheKey, params);

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setData(result);
      setResolvedCacheKey(cacheKey);
      setDataOrganizationId(organizationId);
      setDataAccessScopeKey(accessScopeKey);
    } catch (err: unknown) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if ((err as { code?: string; message?: string })?.code === '57014' || (err as { message?: string })?.message?.includes('57014')) {
        safeLog.warn('Consulta de comparação de marketing cancelada antes de concluir.', err);
        setError('A consulta foi cancelada antes de concluir. Tente novamente.');
        setResolvedCacheKey(cacheKey);
        setDataOrganizationId(organizationId);
        setDataAccessScopeKey(accessScopeKey);
        if (!hasVisibleData) setData([]);
        return;
      }

      safeLog.error('Erro ao buscar comparacao marketing:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setResolvedCacheKey(cacheKey);
      setDataOrganizationId(organizationId);
      setDataAccessScopeKey(accessScopeKey);
      if (!hasVisibleData) {
        setData([]);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [accessScopeKey, currentCacheKey, dataFinal, dataInicial, organizationId, praca]);

  useEffect(() => {
    void fetchData();
    const activeRequestId = requestIdRef.current;

    return () => {
      requestIdRef.current = activeRequestId + 1;
    };
  }, [fetchData]);

  const canShowCurrentOrganizationData = dataOrganizationId === (organizationId || null)
    && dataAccessScopeKey === accessScopeKey;

  return {
    data: canShowCurrentOrganizationData ? data : [],
    loading: loading || Boolean(currentCacheKey && resolvedCacheKey !== currentCacheKey),
    error: resolvedCacheKey === currentCacheKey ? error : null,
    refetch: fetchData,
  };
}
