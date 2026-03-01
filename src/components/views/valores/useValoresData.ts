
import { useState, useEffect, useCallback } from 'react';
import { ValoresEntregador } from '@/types';
import { useValoresServerData } from './hooks/useValoresServerData';
import { useValoresSearch } from './hooks/useValoresSearch';
import { useValoresSort } from './hooks/useValoresSort';
import { useValoresStats } from './hooks/useValoresStats';
import { formatarReal } from './utils/formatters';
import { useValoresBreakdown } from './useValoresBreakdown';

export function useValoresData(initialData: ValoresEntregador[] | null, initialLoading: boolean, filters: any) {
    const { allData, totalServerItems } = useValoresServerData(initialData, filters);

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

    // Paginação Client-Side
    const [visibleCount, setVisibleCount] = useState(30);

    // Resetar paginação quando filtros/busca/ordenação mudam
    useEffect(() => {
        setVisibleCount(30);
    }, [filters, searchTerm, sortField, sortDirection, allData]); // allData changed means reload

    const loadMoreClient = useCallback(() => {
        setVisibleCount(prev => prev + 30);
    }, []);

    const paginatedValores = sortedValores.slice(0, visibleCount);
    const hasMoreClient = visibleCount < sortedValores.length;

    // Estatísticas (Global Breakdown)
    const { data: breakdownData, loading: loadingBreakdown, error: breakdownError } = useValoresBreakdown(filters, true);

    const {
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores
    } = useValoresStats(dataToDisplay);

    return {
        sortedValores, // Mantém completo para Exportação
        paginatedValores, // Fatiado para Exibição na Tabela
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
        loadMore: loadMoreClient, // Override para usar paginação local
        hasMore: hasMoreClient,
        isLoadingMore: false, // Client side é instantâneo
        breakdownData,
        loadingBreakdown
    };
}
