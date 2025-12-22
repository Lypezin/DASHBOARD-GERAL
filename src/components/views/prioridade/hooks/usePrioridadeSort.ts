import { useState, useMemo } from 'react';
import { Entregador } from '@/types';
import {
    calcularPercentualAceitas,
    calcularPercentualCompletadas,
} from '../PrioridadeUtils';

export type SortField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
export type SortDirection = 'asc' | 'desc';

export function usePrioridadeSort(dataFiltrada: Entregador[]) {
    const [sortField, setSortField] = useState<SortField>('aderencia_percentual');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const sortedEntregadores = useMemo(() => {
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

    return {
        sortedEntregadores,
        sortField,
        sortDirection,
        handleSort
    };
}
