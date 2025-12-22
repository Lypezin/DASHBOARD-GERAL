import { ValoresEntregador } from '@/types';
import { useValoresSearch } from './hooks/useValoresSearch';
import { useValoresSort } from './hooks/useValoresSort';
import { useValoresStats } from './hooks/useValoresStats';
import { formatarReal } from './utils/formatters';

export function useValoresData(valoresData: ValoresEntregador[] | null, loading: boolean) {
    // Busca
    const {
        searchTerm,
        setSearchTerm,
        isSearching,
        error,
        dataToDisplay
    } = useValoresSearch(valoresData);

    // Ordenação
    const {
        sortedValores,
        sortField,
        sortDirection,
        handleSort
    } = useValoresSort(dataToDisplay);

    // Estatísticas
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
        error,
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores,
        setSearchTerm,
        handleSort,
        formatarReal
    };
}
