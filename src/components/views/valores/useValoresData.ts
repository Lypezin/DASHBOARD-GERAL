import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurrentUser, ValoresEntregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { CACHE } from '@/constants/config';
import { readSharedCacheEntry, writeSharedCacheEntry } from '@/hooks/data/useCache';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { fetchValoresPage, type ValoresPageData } from '@/utils/tabData/fetchers/valoresFetcher';
import { EXCEL_MAX_DATA_ROWS } from '@/utils/excel/workbookStyle';
import { formatarReal } from './utils/formatters';
import { useValoresSearch } from './hooks/useValoresSearch';
import { useValoresSort } from './hooks/useValoresSort';

const PAGE_SIZE = 100;
const EMPTY_VALORES: ValoresEntregador[] = [];

interface ValoresPageState extends ValoresPageData {
    requestKey: string;
    scopeKey: string;
    searchTerm: string;
    resolved: true;
}

const valoresPageRequests = new Map<string, Promise<ValoresPageData>>();

function getValoresPageCacheKey(scopeKey: string, requestKey: string, offset: number, snapshot?: string) {
    return `valores-page:${createRequestKey({ scopeKey, requestKey, offset, limit: PAGE_SIZE, snapshot: snapshot || null })}`;
}

async function requestValoresPage(cacheKey: string, filterPayload: FilterPayload, bypassCache = false) {
    if (!bypassCache) {
        const cached = readSharedCacheEntry<ValoresPageData>(cacheKey, CACHE.TAB_DATA_TTL);
        if (cached) return cached;
    }

    const existingRequest = valoresPageRequests.get(cacheKey);
    if (existingRequest) return existingRequest;

    const request = (async () => {
        const result = await fetchValoresPage({ filterPayload });
        if (result.error || !result.data) {
            throw new Error(result.error?.message || 'Não foi possível carregar os valores.');
        }

        writeSharedCacheEntry(cacheKey, result.data, CACHE.TAB_DATA_TTL);
        return result.data;
    })().finally(() => {
        if (valoresPageRequests.get(cacheKey) === request) valoresPageRequests.delete(cacheKey);
    });

    valoresPageRequests.set(cacheKey, request);
    return request;
}

export function useValoresData(filterPayload: FilterPayload, currentUser: CurrentUser | null) {
    const { searchTerm, setSearchTerm, isSearching: isSearchTransitionPending } = useValoresSearch();
    const { sortField, sortDirection, handleSort, isSortingDeferred } = useValoresSort();
    const deferredSearchTerm = useDebouncedValue(searchTerm, 300);
    const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

    const incomingFilterKey = createRequestKey(filterPayload);
    const stableFilterPayloadRef = useRef<{ key: string; payload: FilterPayload } | null>(null);
    if (!stableFilterPayloadRef.current || stableFilterPayloadRef.current.key !== incomingFilterKey) {
        stableFilterPayloadRef.current = { key: incomingFilterKey, payload: filterPayload };
    }

    const accessScopeKey = createAccessScopeKey(currentUser, filterPayload.p_organization_id);
    const requestKey = createRequestKey({
        filterKey: incomingFilterKey,
        accessScopeKey,
        search: normalizedSearchTerm,
        sortField,
        sortDirection,
    });

    const [pageState, setPageState] = useState<ValoresPageState | null>(null);
    const [loadingRequestKey, setLoadingRequestKey] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<{ requestKey: string; message: string } | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [retryVersion, setRetryVersion] = useState(0);
    const [forceRefreshKey, setForceRefreshKey] = useState<string | null>(null);
    const requestIdRef = useRef(0);
    const loadMoreIdRef = useRef(0);
    const isLoadingMoreRef = useRef(false);
    const activeRequestKeyRef = useRef(requestKey);
    const pageStateRef = useRef(pageState);
    activeRequestKeyRef.current = requestKey;
    pageStateRef.current = pageState;

    useEffect(() => {
        let cancelled = false;
        const requestId = ++requestIdRef.current;
        loadMoreIdRef.current += 1;
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
        setLoadingRequestKey(requestKey);
        setErrorState(null);

        const pagePayload: FilterPayload = {
            ...(stableFilterPayloadRef.current?.payload || {}),
            detailed: false,
            p_limit: PAGE_SIZE,
            p_offset: 0,
            p_search: normalizedSearchTerm || null,
            p_sort_field: String(sortField),
            p_sort_direction: sortDirection,
        };
        const cacheKey = getValoresPageCacheKey(accessScopeKey, requestKey, 0);

        void requestValoresPage(cacheKey, pagePayload, forceRefreshKey === requestKey)
            .then((page) => {
                if (cancelled || requestIdRef.current !== requestId) return;
                if (page.offset !== 0) throw new Error('A primeira página de valores retornou um deslocamento inválido.');

                setPageState({
                    ...page,
                    requestKey,
                    scopeKey: accessScopeKey,
                    searchTerm: normalizedSearchTerm,
                    resolved: true,
                });
                setErrorState(null);
            })
            .catch((error: unknown) => {
                if (cancelled || requestIdRef.current !== requestId) return;
                setErrorState({
                    requestKey,
                    message: error instanceof Error ? error.message : 'Erro ao carregar os valores.',
                });
            })
            .finally(() => {
                if (!cancelled && requestIdRef.current === requestId) {
                    setLoadingRequestKey((current) => current === requestKey ? null : current);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [accessScopeKey, forceRefreshKey, normalizedSearchTerm, requestKey, retryVersion, sortDirection, sortField]);

    const hasResolvedData = Boolean(pageState && pageState.scopeKey === accessScopeKey && pageState.resolved);
    const hasCurrentQueryData = Boolean(hasResolvedData && pageState && pageState.requestKey === requestKey);
    const error = errorState?.requestKey === requestKey ? errorState.message : null;
    const loading = loadingRequestKey === requestKey || (!hasCurrentQueryData && !error);
    const visibleRows = hasResolvedData && pageState ? pageState.entregadores : EMPTY_VALORES;
    const totalGeral = hasResolvedData && pageState ? pageState.total_geral : 0;
    const totalCorridas = hasResolvedData && pageState ? pageState.total_corridas : 0;
    const taxaMediaGeral = hasResolvedData && pageState ? pageState.taxa_media_geral : 0;
    const totalEntregadores = hasResolvedData && pageState ? pageState.total : 0;
    const hasMore = Boolean(hasResolvedData && pageState && pageState.requestKey === requestKey && pageState.has_more);
    const isSearching = isSearchTransitionPending
        || isSortingDeferred
        || searchTerm !== deferredSearchTerm
        || Boolean(loading && !hasCurrentQueryData);

    const loadMore = useCallback(async () => {
        const current = pageStateRef.current;
        if (
            !current
            || current.scopeKey !== accessScopeKey
            || current.requestKey !== requestKey
            || !current.has_more
            || isLoadingMoreRef.current
        ) return;

        const offset = current.entregadores.length;
        const requestId = ++loadMoreIdRef.current;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        const pagePayload: FilterPayload = {
            ...(stableFilterPayloadRef.current?.payload || {}),
            detailed: false,
            p_limit: PAGE_SIZE,
            p_offset: offset,
            p_search: normalizedSearchTerm || null,
            p_sort_field: String(sortField),
            p_sort_direction: sortDirection,
            p_snapshot: current.snapshot,
        };
        const cacheKey = getValoresPageCacheKey(accessScopeKey, requestKey, offset, current.snapshot);

        try {
            const page = await requestValoresPage(cacheKey, pagePayload);
            if (activeRequestKeyRef.current !== requestKey || loadMoreIdRef.current !== requestId) return;

            const latest = pageStateRef.current;
            if (!latest || latest.requestKey !== requestKey || latest.scopeKey !== accessScopeKey) return;
            if (page.offset !== offset || page.snapshot !== latest.snapshot) {
                throw new Error('Os valores mudaram durante a paginação. Atualize a consulta antes de continuar.');
            }
            if (
                page.total !== latest.total
                || page.total_geral !== latest.total_geral
                || page.total_corridas !== latest.total_corridas
                || page.taxa_media_geral !== latest.taxa_media_geral
            ) {
                throw new Error('O resumo dos valores mudou durante a paginação. Atualize a consulta antes de continuar.');
            }
            if (page.entregadores.length === 0 && latest.entregadores.length < latest.total) {
                throw new Error('A página seguinte de valores veio vazia antes do fim da lista. Atualize a consulta.');
            }

            const existingIds = new Set(latest.entregadores.map((row) => row.id_entregador));
            if (page.entregadores.some((row) => existingIds.has(row.id_entregador))) {
                throw new Error('A página seguinte repetiu entregadores. Atualize a consulta para evitar uma lista incompleta.');
            }

            setPageState((previous) => {
                if (!previous || previous.requestKey !== requestKey || previous.scopeKey !== accessScopeKey) return previous;
                return {
                    ...previous,
                    entregadores: [...previous.entregadores, ...page.entregadores],
                    has_more: page.has_more,
                };
            });
            setErrorState(null);
        } catch (loadError: unknown) {
            if (activeRequestKeyRef.current === requestKey && loadMoreIdRef.current === requestId) {
                setErrorState({
                    requestKey,
                    message: loadError instanceof Error ? loadError.message : 'Erro ao carregar mais valores.',
                });
            }
        } finally {
            if (activeRequestKeyRef.current === requestKey && loadMoreIdRef.current === requestId) {
                isLoadingMoreRef.current = false;
                setIsLoadingMore(false);
            }
        }
    }, [accessScopeKey, normalizedSearchTerm, requestKey, sortDirection, sortField]);

    const loadAllRows = useCallback(async () => {
        const queryKey = requestKey;
        const filterDefinition = stableFilterPayloadRef.current;
        if (!filterDefinition || filterDefinition.key !== incomingFilterKey) {
            throw new Error('Os filtros mudaram antes de iniciar a exportação. Tente novamente.');
        }

        const basePayload: FilterPayload = {
            ...filterDefinition.payload,
            detailed: false,
            p_limit: PAGE_SIZE,
            p_offset: 0,
            p_search: normalizedSearchTerm || null,
            p_sort_field: String(sortField),
            p_sort_direction: sortDirection,
        };
        const firstCacheKey = getValoresPageCacheKey(accessScopeKey, queryKey, 0);
        const firstPage = await requestValoresPage(
            firstCacheKey,
            basePayload,
            forceRefreshKey === queryKey
        );

        if (firstPage.offset !== 0 || firstPage.limit !== PAGE_SIZE) {
            throw new Error('A primeira página de valores veio incompleta. Atualize a consulta antes de exportar.');
        }

        const rows: ValoresEntregador[] = [];
        const seenIds = new Set<string>();
        const appendUniqueRows = (pageRows: ValoresEntregador[]) => {
            for (const row of pageRows) {
                const id = String(row.id_entregador || '').trim();
                if (!id || seenIds.has(id)) {
                    throw new Error('A exportação recebeu um entregador ausente ou repetido. Atualize a consulta antes de exportar.');
                }
                seenIds.add(id);
            }
            rows.push(...pageRows);
        };
        appendUniqueRows(firstPage.entregadores);

        const expectedTotal = firstPage.total;
        if (!Number.isSafeInteger(expectedTotal) || expectedTotal < 0 || rows.length > expectedTotal) {
            throw new Error('A consulta retornou uma quantidade inválida de valores para exportação.');
        }
        if (expectedTotal > EXCEL_MAX_DATA_ROWS) {
            throw new Error(`O relatório excede o limite do Excel de ${EXCEL_MAX_DATA_ROWS.toLocaleString('pt-BR')} linhas.`);
        }

        let currentPage = firstPage;
        while (currentPage.has_more) {
            if (activeRequestKeyRef.current !== queryKey) {
                throw new Error('Os filtros mudaram durante a exportação. Gere o arquivo novamente.');
            }
            const offset = rows.length;
            if (offset >= expectedTotal) {
                throw new Error('A paginação dos valores retornou mais registros que o total informado.');
            }

            const pagePayload: FilterPayload = {
                ...basePayload,
                p_offset: offset,
                p_snapshot: firstPage.snapshot,
            };
            const cacheKey = getValoresPageCacheKey(accessScopeKey, queryKey, offset, firstPage.snapshot);
            const page = await requestValoresPage(cacheKey, pagePayload);

            if (
                page.offset !== offset
                || page.limit !== PAGE_SIZE
                || page.snapshot !== firstPage.snapshot
                || page.total !== expectedTotal
                || page.total_geral !== firstPage.total_geral
                || page.total_corridas !== firstPage.total_corridas
                || page.taxa_media_geral !== firstPage.taxa_media_geral
                || page.entregadores.length === 0
            ) {
                throw new Error('Os valores mudaram ou uma página veio incompleta durante a exportação. Atualize a consulta.');
            }

            appendUniqueRows(page.entregadores);
            if (page.has_more !== (rows.length < expectedTotal)) {
                throw new Error('A paginação dos valores terminou antes ou depois do total informado. Atualize a consulta.');
            }
            currentPage = page;
        }

        if (rows.length !== expectedTotal) {
            throw new Error('A exportação recebeu apenas parte dos valores. Atualize a consulta antes de tentar novamente.');
        }
        if (activeRequestKeyRef.current !== queryKey) {
            throw new Error('Os filtros mudaram durante a exportação. Gere o arquivo novamente.');
        }

        return rows;
    }, [accessScopeKey, forceRefreshKey, incomingFilterKey, normalizedSearchTerm, requestKey, sortDirection, sortField]);

    const retry = useCallback(() => {
        setErrorState(null);
        setForceRefreshKey(requestKey);
        setRetryVersion((version) => version + 1);
    }, [requestKey]);

    return {
        sortedValores: visibleRows,
        paginatedValores: visibleRows,
        sortField,
        sortDirection,
        searchTerm,
        isSearching,
        error,
        hasResolvedData: Boolean(hasResolvedData),
        loading,
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores,
        setSearchTerm,
        handleSort,
        formatarReal,
        loadMore,
        loadAllRows,
        hasMore,
        isLoadingMore,
        retry,
    };
}
