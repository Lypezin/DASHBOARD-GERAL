import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ValoresEntregador } from '@/types';

export function useValoresSort(dataToDisplay: ValoresEntregador[]) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const getInitialSortField = () => {
        return (searchParams.get('val_sort') as keyof ValoresEntregador) || 'total_taxas';
    };
    const getInitialSortDirection = () => {
        return (searchParams.get('val_dir') as 'asc' | 'desc') || 'desc';
    };

    const [sortField, setSortField] = useState<keyof ValoresEntregador>(getInitialSortField);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(getInitialSortDirection);

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (sortField !== 'total_taxas') {
            if (params.get('val_sort') !== sortField) { params.set('val_sort', sortField); changed = true; }
        } else if (params.has('val_sort')) { params.delete('val_sort'); changed = true; }

        if (sortDirection !== 'desc') {
            if (params.get('val_dir') !== sortDirection) { params.set('val_dir', sortDirection); changed = true; }
        } else if (params.has('val_dir')) { params.delete('val_dir'); changed = true; }

        if (changed) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [sortField, sortDirection, pathname, router, searchParams]);

    // Update state if URL changes externally (optional but good practice)
    useEffect(() => {
        const urlSort = getInitialSortField();
        const urlDir = getInitialSortDirection();
        if (urlSort !== sortField) setSortField(urlSort);
        if (urlDir !== sortDirection) setSortDirection(urlDir);
    }, [searchParams]);

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
