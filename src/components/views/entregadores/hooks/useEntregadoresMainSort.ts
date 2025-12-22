import { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';

export function useEntregadoresMainSort(entregadoresData: EntregadoresData | null) {
    const [sortField, setSortField] = useState<keyof Entregador | 'percentual_aceitas' | 'percentual_completadas'>('aderencia_percentual');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const sortedEntregadores: Entregador[] = useMemo(() => {
        if (!entregadoresData?.entregadores) return [];

        let filtered = entregadoresData.entregadores;

        // Aplicar filtro de busca
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (e) =>
                    e.nome_entregador.toLowerCase().includes(term) ||
                    e.id_entregador.toLowerCase().includes(term)
            );
        }

        // Ordenar
        const sorted = [...filtered].sort((a, b) => {
            let aValue: number | string;
            let bValue: number | string;

            if (sortField === 'percentual_aceitas') {
                aValue = calcularPercentualAceitas(a);
                bValue = calcularPercentualAceitas(b);
            } else if (sortField === 'percentual_completadas') {
                aValue = calcularPercentualCompletadas(a);
                bValue = calcularPercentualCompletadas(b);
            } else {
                aValue = a[sortField] ?? 0;
                bValue = b[sortField] ?? 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortDirection === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });

        return sorted;
    }, [entregadoresData, searchTerm, sortField, sortDirection]);

    const handleSort = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    return {
        sortedEntregadores,
        sortField,
        sortDirection,
        searchTerm,
        setSearchTerm,
        handleSort
    };
}
