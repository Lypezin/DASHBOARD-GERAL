import { useState, useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { CITY_DB_MAPPING } from '@/constants/marketing';
import { fetchFluxoSemanal } from './api/fetchFluxoSemanal';
import { processFluxoData, FluxoEntregadores } from './utils/processFluxoData';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const CACHE_TTL_MS = 1000 * 60 * 15;
const STALE_CACHE_TTL_MS = 1000 * 60 * 60;
const STORAGE_CACHE_KEY = 'marketing_fluxo_cache_v2';
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

            const staleCached = readFluxoCache(cacheKey, true);
            if (staleCached) {
                setData(staleCached);
                setError(null);
            }

            const hasVisibleData = hasVisibleDataRef.current;
            setLoading(!staleCached);
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
    return readFluxoCache(cacheKey, false);
}

function readFluxoCache(cacheKey: string, allowStale: boolean) {
    const cached = fluxoCache.get(cacheKey) || readPersistedFluxo(cacheKey);
    if (!cached) return null;

    const maxAge = allowStale ? STALE_CACHE_TTL_MS : CACHE_TTL_MS;
    if (Date.now() - cached.timestamp > maxAge) {
        fluxoCache.delete(cacheKey);
        removePersistedFluxo(cacheKey);
        return null;
    }

    fluxoCache.set(cacheKey, cached);
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
    writePersistedFluxo(cacheKey, filteredData);

    return filteredData;
}

function getPersistedFluxoCache() {
    if (typeof sessionStorage === 'undefined') return {};

    return readJsonStorage<Record<string, { timestamp: number; data: FluxoEntregadores[] }>>(
        sessionStorage,
        STORAGE_CACHE_KEY,
        {}
    ) || {};
}

function readPersistedFluxo(cacheKey: string) {
    const cache = getPersistedFluxoCache();
    const entry = cache[cacheKey];
    if (!entry || !Array.isArray(entry.data) || typeof entry.timestamp !== 'number') {
        return null;
    }

    return entry;
}

function writePersistedFluxo(cacheKey: string, data: FluxoEntregadores[]) {
    if (typeof sessionStorage === 'undefined') return;

    const cache = getPersistedFluxoCache();
    cache[cacheKey] = { timestamp: Date.now(), data };

    const entries = Object.entries(cache)
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, 12);

    writeJsonStorage(sessionStorage, STORAGE_CACHE_KEY, Object.fromEntries(entries));
}

function removePersistedFluxo(cacheKey: string) {
    if (typeof sessionStorage === 'undefined') return;

    const cache = getPersistedFluxoCache();
    if (!(cacheKey in cache)) return;

    delete cache[cacheKey];
    writeJsonStorage(sessionStorage, STORAGE_CACHE_KEY, cache);
}
