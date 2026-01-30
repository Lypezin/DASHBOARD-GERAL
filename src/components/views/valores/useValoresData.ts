
import { useState, useEffect, useCallback } from 'react';
import { ValoresEntregador } from '@/types';
import { useValoresSearch } from './hooks/useValoresSearch';
import { useValoresSort } from './hooks/useValoresSort';
import { useValoresStats } from './hooks/useValoresStats';
import { formatarReal } from './utils/formatters';
import { fetchValoresDetalhados } from '@/utils/tabData/fetchers/valoresFetcher';
import { useValoresBreakdown } from './useValoresBreakdown';
import { FilterPayload } from '@/types/filters';

export function useValoresData(initialData: ValoresEntregador[] | null, initialLoading: boolean, filters: any) {
    const [allData, setAllData] = useState<ValoresEntregador[]>(initialData || []);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalServerItems, setTotalServerItems] = useState(0);

    // Update local state when initialData changes
    useEffect(() => {
        if (initialData) {
            setAllData(initialData);
            const total = (initialData as any).total;
            if (total !== undefined) {
                setTotalServerItems(total);
                setHasMore(initialData.length < total);
            } else {
                setHasMore(false);
            }
        }
    }, [initialData]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextOffset = allData.length;

        try {
            // We construct payload manually since we don't have the builder here easily
            // and we trust 'filters' contains the raw values from useDashboardFilters
            const payload: FilterPayload = {
                ...filters,
                p_limit: 25,
                p_offset: nextOffset,
                detailed: true // We assume meaningful infinite scroll happens in detailed mode or regular mode
            };

            const result = await fetchValoresDetalhados({ filterPayload: payload });

            if (result.data) {
                setAllData(prev => [...prev, ...result.data!]);
                if (result.total) setTotalServerItems(result.total);

                // If we received fewer items than requested (25), we know we are done
                if (result.data.length < 25) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }

        } catch (e) {
            console.error('Error loading more items', e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [allData.length, filters, hasMore, isLoadingMore]);

    // Busca (Local)
    const {
        searchTerm,
        setSearchTerm,
        isSearching,
        error: searchError,
        dataToDisplay
    } = useValoresSearch(allData);

    // Ordenação (Local)
    const {
        sortedValores,
        sortField,
        sortDirection,
        handleSort
    } = useValoresSort(dataToDisplay);

    // Estatísticas (Global Breakdown)
    const { data: breakdownData, loading: loadingBreakdown, error: breakdownError } = useValoresBreakdown(filters, true);

    const {
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores
    } = useValoresStats(dataToDisplay);

    return {
        sortedValores,
        sortField,
        sortDirection,
        searchTerm,
        isSearching,
        error: searchError || breakdownError || null,
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores: totalServerItems || totalEntregadores,
        setSearchTerm,
        handleSort,
        formatarReal,
        loadMore,
        hasMore,
        isLoadingMore,
        breakdownData,
        loadingBreakdown
    };
}
