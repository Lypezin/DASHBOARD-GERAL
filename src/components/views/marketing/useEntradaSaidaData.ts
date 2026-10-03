import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { CITY_DB_MAPPING } from '@/constants/marketing';
import { fetchFluxoSemanal } from './api/fetchFluxoSemanal';
import { processFluxoData, FluxoEntregadores } from './utils/processFluxoData';
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';

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

function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function useEntradaSaidaData({
    dataInicial,
    dataFinal,
    organizationId,
    praca
}: UseEntradaSaidaDataProps) {
    const { currentUser } = useAppBootstrap();
    const accessScopeKey = createAccessScopeKey(currentUser, organizationId);
    const [data, setData] = useState<FluxoEntregadores[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolvedCacheKey, setResolvedCacheKey] = useState<string | null>(null);
    const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
    const [dataCacheKey, setDataCacheKey] = useState<string | null>(null);
    const [dataAccessScopeKey, setDataAccessScopeKey] = useState<string | null>(null);

    const hasExplicitRange = Boolean(dataInicial && dataFinal);
    let start = dataInicial;
    let end = dataFinal;
    if (!hasExplicitRange) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        start = formatLocalDate(firstDay);
        end = formatLocalDate(now);
    }

    const resolvedStart = start || '';
    const resolvedEnd = end || '';

    const dbPraca = praca ? CITY_DB_MAPPING[praca] || praca : null;
    const cacheKey = organizationId ? buildCacheKey(organizationId, dbPraca, resolvedStart, resolvedEnd, accessScopeKey) : null;

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            if (!organizationId) {
                setData([]);
                setLoading(false);
                setError(null);
                setResolvedCacheKey(null);
                setDataOrganizationId(null);
                setDataCacheKey(null);
                setDataAccessScopeKey(null);
                return;
            }

            if (!cacheKey) return;

            const cached = getCachedFluxo(cacheKey);

            if (cached) {
                setData(cached);
                setError(null);
                setResolvedCacheKey(cacheKey);
                setDataOrganizationId(organizationId);
                setDataCacheKey(cacheKey);
                setDataAccessScopeKey(accessScopeKey);
                setLoading(false);
                return;
            }

            const staleCached = readFluxoCache(cacheKey, true);
            if (staleCached) {
                setData(staleCached);
                setError(null);
                setResolvedCacheKey(cacheKey);
                setDataOrganizationId(organizationId);
                setDataCacheKey(cacheKey);
                setDataAccessScopeKey(accessScopeKey);
            }
            // Stale data stays visible, while the banner communicates that a
            // fresh response for these exact filters is still being requested.
            setLoading(true);
            setError(null);

            try {
                const filteredData = await fetchFluxoWithDedupe(cacheKey, {
                    dataInicial: resolvedStart,
                    dataFinal: resolvedEnd,
                    organizationId,
                    praca: dbPraca,
                    includeNames: false,
                });

                if (cancelled) return;
                setData(filteredData);
                setResolvedCacheKey(cacheKey);
                setDataOrganizationId(organizationId);
                setDataCacheKey(cacheKey);
                setDataAccessScopeKey(accessScopeKey);
            } catch (err: unknown) {
                if (cancelled) return;

                safeLog.error('Erro ao buscar fluxo de entregadores:', err);
                const fallback = fluxoCache.get(cacheKey)?.data;

                if (fallback) {
                    setData(fallback);
                    setError('Não foi possível atualizar. Exibindo os dados salvos anteriormente.');
                    setResolvedCacheKey(cacheKey);
                    setDataOrganizationId(organizationId);
                    setDataCacheKey(cacheKey);
                    setDataAccessScopeKey(accessScopeKey);
                    return;
                }

                setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
                setResolvedCacheKey(cacheKey);
                setDataOrganizationId(organizationId);
                setDataAccessScopeKey(accessScopeKey);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void fetchData();

        return () => {
            cancelled = true;
        };
    }, [accessScopeKey, cacheKey, dbPraca, organizationId, resolvedEnd, resolvedStart]);

    const waitingForCurrentFilters = Boolean(organizationId && cacheKey && resolvedCacheKey !== cacheKey);
    const canShowCurrentRequestData = dataOrganizationId === organizationId
        && dataCacheKey === cacheKey
        && dataAccessScopeKey === accessScopeKey;

    return {
        data: canShowCurrentRequestData ? data : [],
        loading: loading || waitingForCurrentFilters,
        error: resolvedCacheKey === cacheKey ? error : null,
    };
}

function buildCacheKey(
    organizationId: string,
    praca: string | null,
    dataInicial: string,
    dataFinal: string,
    accessScopeKey: string
) {
    return `${accessScopeKey}|${organizationId}|${praca || 'all'}|${dataInicial}|${dataFinal}`;
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
