import { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { usePrioridadeSearch } from './usePrioridadeSearch';
import { usePrioridadeFilters } from './hooks/usePrioridadeFilters';
import { usePrioridadeSort, SortField, SortDirection } from './hooks/usePrioridadeSort';

export type { SortField, SortDirection };

export function usePrioridadeData(entregadoresData: EntregadoresData | null) {
    const [searchTerm, setSearchTerm] = useState('');

    // Hook para pesquisa
    const { searchResults, isSearching } = usePrioridadeSearch(searchTerm, entregadoresData);

    // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
    const dataToDisplay = useMemo(() => {
        const baseData = entregadoresData?.entregadores;
        const baseArray = Array.isArray(baseData) ? baseData : [];
        return (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) ? searchResults : baseArray;
    }, [searchTerm, searchResults, entregadoresData]);

    // Hook para filtros
    const {
        dataFiltrada,
        filtroAderencia,
        filtroRejeicao,
        filtroCompletadas,
        filtroAceitas,
        setFiltroAderencia,
        setFiltroRejeicao,
        setFiltroCompletadas,
        setFiltroAceitas,
        handleClearFilters
    } = usePrioridadeFilters(dataToDisplay);

    // Hook para ordenação
    const {
        sortedEntregadores,
        sortField,
        sortDirection,
        handleSort
    } = usePrioridadeSort(dataFiltrada);

    return {
        sortedEntregadores,
        dataFiltrada,
        sortField,
        sortDirection,
        searchTerm,
        isSearching,
        filtroAderencia,
        filtroRejeicao,
        filtroCompletadas,
        filtroAceitas,
        setSearchTerm,
        setFiltroAderencia,
        setFiltroRejeicao,
        setFiltroCompletadas,
        setFiltroAceitas,
        handleSort,
        handleClearFilters
    };
}
