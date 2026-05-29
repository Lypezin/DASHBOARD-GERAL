import { useState, useEffect } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { safeLog } from '@/lib/errorHandler';
import { CITY_DB_MAPPING } from '@/constants/marketing';
import { processFluxoData, FluxoEntregadores } from './utils/processFluxoData';

const CACHE_TTL_MS = 1000 * 60 * 5;
const fluxoCache = new Map<string, { timestamp: number; data: FluxoEntregadores[] }>();
const inFlightRequests = new Map<string, Promise<FluxoEntregadores[]>>();

interface UseEntradaSaidaDataProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export function useEntradaSaidaData({
    dataInicial,
    dataFinal,
    organizationId,
    praca
}: UseEntradaSaidaDataProps) {
    const [data, setData] = useState<FluxoEntregadores[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            if (!organizationId) {
                setData([]);
                setLoading(false);
                return;
            }

            let start = dataInicial;
            let end = dataFinal;

            if (!start || !end) {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), 0, 1);
                start = firstDay.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            }

            const dbPraca = praca ? CITY_DB_MAPPING[praca] || praca : null;
            const cacheKey = buildCacheKey(organizationId, dbPraca, start, end);
            const cached = getCachedFluxo(cacheKey);

            if (cached) {
                setData(cached);
                setError(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const filteredData = await fetchFluxoWithDedupe(cacheKey, {
                    p_data_inicial: start,
                    p_data_final: end,
                    p_organization_id: organizationId,
                    p_praca: dbPraca,
                    p_include_names: false
                });

                if (cancelled) return;
                setData(filteredData);
            } catch (err: unknown) {
                if (cancelled) return;

                safeLog.error('Erro ao buscar fluxo de entregadores:', err);
                const fallback = fluxoCache.get(cacheKey)?.data;

                if (fallback) {
                    setData(fallback);
                    setError(null);
                    return;
                }

                setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void fetchData();

        return () => {
            cancelled = true;
        };
    }, [dataInicial, dataFinal, organizationId, praca]);

    return { data, loading, error };
}

function buildCacheKey(
    organizationId: string,
    praca: string | null,
    dataInicial: string,
    dataFinal: string
) {
    return `${organizationId}|${praca || 'all'}|${dataInicial}|${dataFinal}`;
}

function getCachedFluxo(cacheKey: string) {
    const cached = fluxoCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        fluxoCache.delete(cacheKey);
        return null;
    }

    return cached.data;
}

async function fetchFluxoWithDedupe(cacheKey: string, params: Record<string, unknown>) {
    const activeRequest = inFlightRequests.get(cacheKey);
    if (activeRequest) return activeRequest;

    const request = fetchFluxo(cacheKey, params).finally(() => {
        inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, request);
    return request;
}

async function fetchFluxo(cacheKey: string, params: Record<string, unknown>) {
    const { data: rpcData, error: rpcError } = await safeRpc<any[]>('get_fluxo_semanal', params, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (rpcError) throw rpcError;

    const rawData = Array.isArray(rpcData) ? rpcData : (rpcData || []);
    const filteredData = processFluxoData(rawData);

    fluxoCache.set(cacheKey, {
        timestamp: Date.now(),
        data: filteredData
    });

    return filteredData;
}
