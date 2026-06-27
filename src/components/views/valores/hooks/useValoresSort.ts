import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ValoresEntregador } from '@/types';

const stringCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function useValoresSort(dataToDisplay: ValoresEntregador[]) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParamsKey = searchParams.toString();
    const deferredDataToDisplay = useDeferredValue(dataToDisplay);
    const [isPending, startTransition] = useTransition();

    const getInitialSortField = useCallback(() => {
        return (searchParams.get('val_sort') as keyof ValoresEntregador) || 'total_taxas';
    }, [searchParams]);
    const getInitialSortDirection = useCallback(() => {
        return (searchParams.get('val_dir') as 'asc' | 'desc') || 'desc';
    }, [searchParams]);

    const [sortField, setSortFieldState] = useState<keyof ValoresEntregador>(getInitialSortField);
    const [sortDirection, setSortDirectionState] = useState<'asc' | 'desc'>(getInitialSortDirection);

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
            const nextQuery = params.toString();
            const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
            const currentQuery = searchParams.toString();
            const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

            if (nextUrl !== currentUrl) {
                router.replace(nextUrl, { scroll: false });
            }
        }
    }, [sortField, sortDirection, pathname, router, searchParams]);

    useEffect(() => {
        const urlSort = getInitialSortField();
        const urlDir = getInitialSortDirection();
        if (urlSort !== sortField) setSortFieldState(urlSort);
        if (urlDir !== sortDirection) setSortDirectionState(urlDir);
    }, [getInitialSortDirection, getInitialSortField, searchParamsKey, sortDirection, sortField]);

    const sortedValores = useMemo(() => {
        if (!Array.isArray(deferredDataToDisplay) || deferredDataToDisplay.length === 0) return [];

        const dataCopy = [...deferredDataToDisplay];

        return dataCopy.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
                const aStr = String(aValue).toLowerCase().trim();
                const bStr = String(bValue).toLowerCase().trim();
                const comparison = stringCollator.compare(aStr, bStr);
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;

            const comparison = aNum - bNum;

            if (comparison === 0) {
                return stringCollator.compare(a.nome_entregador, b.nome_entregador);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [deferredDataToDisplay, sortField, sortDirection]);

    const handleSort = useCallback((field: keyof ValoresEntregador) => {
        startTransition(() => {
            if (sortField === field) {
                setSortDirectionState(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortFieldState(field);
                setSortDirectionState('desc');
            }
        });
    }, [sortDirection, sortField]);

    return {
        sortedValores,
        sortField,
        sortDirection,
        handleSort,
        isSortingDeferred: isPending || deferredDataToDisplay !== dataToDisplay
    };
}
