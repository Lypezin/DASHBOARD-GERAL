import { useState, useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { CITY_DB_MAPPING } from '@/constants/marketing';
import { fetchFluxoSemanal } from './api/fetchFluxoSemanal';
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
    const hasVisibleDataRef = useRef(false);

    hasVisibleDataRef.current = data.length > 0;

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

            const hasVisibleData = hasVisibleDataRef.current;
            setLoading(true);
            setError(null);

            try {
                const filteredData = await fetchFluxoWithDedupe(cacheKey, {
                    dataInicial: start,
                    dataFinal: end,
                    organizationId,
                    praca: dbPraca,
                    includeNames: false,
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
                if (!hasVisibleData) {
                    setData([]);
                }
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

type FluxoFetchParams = {
    dataFinal: string;
    dataInicial: string;
    includeNames?: boolean;
    organizationId: string;
    praca?: string | null;
};

async function fetchFluxoWithDedupe(cacheKey: string, params: FluxoFetchParams) {
    const activeRequest = inFlightRequests.get(cacheKey);
    if (activeRequest) return activeRequest;

    const request = fetchFluxo(cacheKey, params).finally(() => {
        inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, request);
    return request;
}

async function fetchFluxo(cacheKey: string, params: FluxoFetchParams) {
    const rawData = await fetchFluxoSemanal(params);
    const filteredData = processFluxoData(rawData);

    fluxoCache.set(cacheKey, {
        timestamp: Date.now(),
        data: filteredData
    });

    return filteredData;
}
