import { useCallback, useDeferredValue, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ValoresEntregador } from '@/types';

const stringCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const DEFAULT_SORT_FIELD: keyof ValoresEntregador = 'total_taxas';
const DEFAULT_SORT_DIRECTION = 'desc' as const;
const SORTABLE_FIELDS = new Set<keyof ValoresEntregador>([
    'nome_entregador',
    'id_entregador',
    'total_taxas',
    'numero_corridas_aceitas',
    'taxa_media',
    'turno',
    'sub_praca',
]);

export function useValoresSort(dataToDisplay: ValoresEntregador[]) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const deferredDataToDisplay = useDeferredValue(dataToDisplay);
    const [isPending, startTransition] = useTransition();

    const sortField = useMemo<keyof ValoresEntregador>(() => {
        const requestedField = searchParams.get('val_sort') as keyof ValoresEntregador | null;
        return requestedField && SORTABLE_FIELDS.has(requestedField)
            ? requestedField
            : DEFAULT_SORT_FIELD;
    }, [searchParams]);

    const sortDirection = useMemo<'asc' | 'desc'>(() => {
        return searchParams.get('val_dir') === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION;
    }, [searchParams]);

    const sortedValores = useMemo(() => {
        if (!Array.isArray(deferredDataToDisplay) || deferredDataToDisplay.length === 0) return [];
        if (sortField === 'total_taxas' && sortDirection === 'desc') {
            return deferredDataToDisplay;
        }

        const dataCopy = [...deferredDataToDisplay];

        return dataCopy.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (
                sortField === 'nome_entregador' ||
                sortField === 'id_entregador' ||
                sortField === 'turno' ||
                sortField === 'sub_praca'
            ) {
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
        if (!SORTABLE_FIELDS.has(field)) return;

        const nextDirection = sortField === field && sortDirection === 'desc'
            ? 'asc'
            : 'desc';
        const params = new URLSearchParams(searchParams.toString());

        if (field === DEFAULT_SORT_FIELD) params.delete('val_sort');
        else params.set('val_sort', field);

        if (nextDirection === DEFAULT_SORT_DIRECTION) params.delete('val_dir');
        else params.set('val_dir', nextDirection);

        const nextQuery = params.toString();
        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

        startTransition(() => {
            router.replace(nextUrl, { scroll: false });
        });
    }, [pathname, router, searchParams, sortDirection, sortField]);

    return {
        sortedValores,
        sortField,
        sortDirection,
        handleSort,
        isSortingDeferred: isPending || deferredDataToDisplay !== dataToDisplay
    };
}
