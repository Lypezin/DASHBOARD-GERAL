import { useCallback, useEffect, useRef, useState } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';

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

const CACHE_TTL_MS = 5 * 60 * 1000;
const comparisonCache = new Map<string, { timestamp: number; data: MarketingComparisonData[] }>();
const comparisonRequests = new Map<string, Promise<MarketingComparisonData[]>>();

function buildCacheKey(dataInicial: string, dataFinal: string, organizationId: string, praca: string | null) {
  return `${organizationId}|${praca || 'all'}|${dataInicial}|${dataFinal}`;
}

function getCachedValue(cacheKey: string) {
  const cached = comparisonCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    comparisonCache.delete(cacheKey);
    return null;
  }

  return cached.data;
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

    const normalized = result || [];
    comparisonCache.set(cacheKey, {
      timestamp: Date.now(),
      data: normalized,
    });

    return normalized;
  })().finally(() => {
    comparisonRequests.delete(cacheKey);
  });

  comparisonRequests.set(cacheKey, request);
  return request;
}

export function useMarketingComparacao(dataInicial: string, dataFinal: string, organizationId: string | undefined, praca: string | null) {
  const [data, setData] = useState<MarketingComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!dataInicial || !dataFinal || !organizationId) return;

    const currentRequestId = ++requestIdRef.current;
    const cacheKey = buildCacheKey(dataInicial, dataFinal, organizationId, praca);
    const cached = getCachedValue(cacheKey);

    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }

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
    } catch (err: unknown) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if ((err as { code?: string; message?: string })?.code === '57014' || (err as { message?: string })?.message?.includes('57014')) {
        safeLog.warn('Ignored cancelled request', err);
        return;
      }

      safeLog.error('Erro ao buscar comparacao marketing:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [dataInicial, dataFinal, organizationId, praca]);

  useEffect(() => {
    void fetchData();
    const activeRequestId = requestIdRef.current;

    return () => {
      requestIdRef.current = activeRequestId + 1;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
