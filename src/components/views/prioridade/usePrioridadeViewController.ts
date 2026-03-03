
import { EntregadoresData } from '@/types';
import { usePrioridadeData } from './usePrioridadeData';
import { usePrioridadeStats } from './hooks/usePrioridadeStats';

export function usePrioridadeViewController(
    entregadoresData: EntregadoresData | null,
    loading: boolean
) {
    const {
        sortedEntregadores,
        paginatedEntregadores,
        loadMore,
        hasMore,
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
    } = usePrioridadeData(entregadoresData);

    // Calcular estatísticas
    const stats = usePrioridadeStats(dataFiltrada);

    return {
        state: {
            loading,
            entregadoresData,
            sortedEntregadores,
            paginatedEntregadores,
            hasMore,
            dataFiltrada,
            sortField,
            sortDirection,
            searchTerm,
            isSearching,
            filtroAderencia,
            filtroRejeicao,
            filtroCompletadas,
            filtroAceitas,
            stats
        },
        actions: {
            loadMore,
            setSearchTerm,
            setFiltroAderencia,
            setFiltroRejeicao,
            setFiltroCompletadas,
            setFiltroAceitas,
            handleSort,
            handleClearFilters
        }
    };
}
