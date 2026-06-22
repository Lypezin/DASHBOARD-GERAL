import { useState, useEffect, useCallback, useMemo } from 'react';
import { ValoresEntregador } from '@/types';
import { useValoresServerData } from './hooks/useValoresServerData';
import { useValoresSearch } from './hooks/useValoresSearch';
import { useValoresSort } from './hooks/useValoresSort';
import { useValoresStats } from './hooks/useValoresStats';
import { formatarReal } from './utils/formatters';
import { useValoresBreakdown } from './useValoresBreakdown';

export function useValoresData(initialData: ValoresEntregador[] | null, initialLoading: boolean, filters: any) {
    const { allData, totalServerItems } = useValoresServerData(initialData, filters);

    const {
        searchTerm,
        setSearchTerm,
        isSearching,
        error: searchError,
        dataToDisplay
    } = useValoresSearch(allData);

    const {
        sortedValores,
        sortField,
        sortDirection,
        handleSort,
        isSortingDeferred
    } = useValoresSort(dataToDisplay);

    const initialVisibleCount = useMemo(() => {
        if (sortedValores.length > 1000) return 15;
        if (sortedValores.length > 400) return 20;
        return 30;
    }, [sortedValores.length]);
    const loadMoreStep = initialVisibleCount;
    const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

    useEffect(() => {
        setVisibleCount(initialVisibleCount);
    }, [filters, searchTerm, sortField, sortDirection, allData, initialVisibleCount]);

    const loadMoreClient = useCallback(() => {
        setVisibleCount(prev => prev + loadMoreStep);
    }, [loadMoreStep]);

    const paginatedValores = sortedValores.slice(0, visibleCount);
    const hasMoreClient = visibleCount < sortedValores.length;

    const shouldLoadBreakdown = Boolean(filters?.detailed);
    const { data: breakdownData, loading: loadingBreakdown, error: breakdownError } = useValoresBreakdown(filters, shouldLoadBreakdown);

    const {
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores
    } = useValoresStats(dataToDisplay);

    return {
        sortedValores,
        paginatedValores,
        sortField,
        sortDirection,
        searchTerm,
        isSearching: isSearching || isSortingDeferred,
        error: searchError || breakdownError || null,
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores: searchTerm.trim() ? totalEntregadores : (totalServerItems || totalEntregadores),
        setSearchTerm,
        handleSort,
        formatarReal,
        loadMore: loadMoreClient,
        hasMore: hasMoreClient,
        isLoadingMore: false,
        breakdownData,
        loadingBreakdown
    };
}
