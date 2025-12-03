import { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { usePrioridadeSearch } from './usePrioridadeSearch';
import {
    calcularPercentualAceitas,
    calcularPercentualCompletadas,
} from './PrioridadeUtils';

export type SortField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
export type SortDirection = 'asc' | 'desc';

export function usePrioridadeData(entregadoresData: EntregadoresData | null) {
    const [sortField, setSortField] = useState<SortField>('aderencia_percentual');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroAderencia, setFiltroAderencia] = useState<string>('');
    const [filtroRejeicao, setFiltroRejeicao] = useState<string>('');
    const [filtroCompletadas, setFiltroCompletadas] = useState<string>('');
    const [filtroAceitas, setFiltroAceitas] = useState<string>('');

    // Hook para pesquisa
    const { searchResults, isSearching } = usePrioridadeSearch(searchTerm, entregadoresData);

    // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
    const dataToDisplay = useMemo(() => {
        const baseData = entregadoresData?.entregadores;
        const baseArray = Array.isArray(baseData) ? baseData : [];
        return (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) ? searchResults : baseArray;
    }, [searchTerm, searchResults, entregadoresData]);

    // Aplicar filtros de % de aderência, rejeição, completadas e aceitas
    const dataFiltrada = useMemo(() => {
        if (!Array.isArray(dataToDisplay)) return [];
        let filtered = [...dataToDisplay];

        // Filtro por % de aderência (mostrar apenas quem tem o valor ou acima)
        if (filtroAderencia.trim()) {
            const aderenciaMin = parseFloat(filtroAderencia);
            if (!isNaN(aderenciaMin)) {
                filtered = filtered.filter(e => (e.aderencia_percentual ?? 0) >= aderenciaMin);
            }
        }

        // Filtro por % de rejeição (mostrar apenas quem tem o valor ou abaixo)
        if (filtroRejeicao.trim()) {
            const rejeicaoMax = parseFloat(filtroRejeicao);
            if (!isNaN(rejeicaoMax)) {
                filtered = filtered.filter(e => (e.rejeicao_percentual ?? 0) <= rejeicaoMax);
            }
        }

        // Filtro por % de completadas (mostrar apenas quem tem o valor ou acima)
        if (filtroCompletadas.trim()) {
            const completadasMin = parseFloat(filtroCompletadas);
            if (!isNaN(completadasMin)) {
                filtered = filtered.filter(e => {
                    const corridasOfertadas = e.corridas_ofertadas || 0;
                    if (corridasOfertadas === 0) return false;
                    const percentualCompletadas = (e.corridas_completadas / corridasOfertadas) * 100;
                    return percentualCompletadas >= completadasMin;
                });
            }
        }

        // Filtro por % de aceitas (mostrar apenas quem tem o valor ou acima)
        if (filtroAceitas.trim()) {
            const aceitasMin = parseFloat(filtroAceitas);
            if (!isNaN(aceitasMin)) {
                filtered = filtered.filter(e => {
                    const corridasOfertadas = e.corridas_ofertadas || 0;
                    if (corridasOfertadas === 0) return false;
                    const percentualAceitas = (e.corridas_aceitas / corridasOfertadas) * 100;
                    return percentualAceitas >= aceitasMin;
                });
            }
        }

        return filtered;
    }, [dataToDisplay, filtroAderencia, filtroRejeicao, filtroCompletadas, filtroAceitas]);

    // Criar uma cópia estável para ordenação
    const sortedEntregadores: Entregador[] = useMemo(() => {
        if (!dataFiltrada || dataFiltrada.length === 0) return [];

        const dataCopy = [...dataFiltrada];

        return dataCopy.sort((a, b) => {
            if (sortField === 'percentual_aceitas') {
                const aPercent = calcularPercentualAceitas(a);
                const bPercent = calcularPercentualAceitas(b);
                const comparison = aPercent - bPercent;
                if (comparison === 0) {
                    return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            if (sortField === 'percentual_completadas') {
                const aPercent = calcularPercentualCompletadas(a);
                const bPercent = calcularPercentualCompletadas(b);
                const comparison = aPercent - bPercent;
                if (comparison === 0) {
                    return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const aValue = a[sortField as keyof Entregador];
            const bValue = b[sortField as keyof Entregador];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
                const aStr = String(aValue).toLowerCase().trim();
                const bStr = String(bValue).toLowerCase().trim();
                const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;

            const comparison = aNum - bNum;

            if (comparison === 0) {
                return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [dataFiltrada, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleClearFilters = () => {
        setFiltroAderencia('');
        setFiltroRejeicao('');
        setFiltroCompletadas('');
        setFiltroAceitas('');
    };

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
