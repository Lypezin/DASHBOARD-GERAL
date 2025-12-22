import { useState, useMemo } from 'react';
import { ValoresEntregador } from '@/types';

export function useValoresSort(dataToDisplay: ValoresEntregador[]) {
    const [sortField, setSortField] = useState<keyof ValoresEntregador>('total_taxas');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const sortedValores = useMemo(() => {
        if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) return [];

        const dataCopy = [...dataToDisplay];

        return dataCopy.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

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
    }, [dataToDisplay, sortField, sortDirection]);

    const handleSort = (field: keyof ValoresEntregador) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    return {
        sortedValores,
        sortField,
        sortDirection,
        handleSort
    };
}
