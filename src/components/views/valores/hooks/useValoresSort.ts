import { useCallback, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ValoresEntregador } from '@/types';

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

export function useValoresSort() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
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
        sortField,
        sortDirection,
        handleSort,
        isSortingDeferred: isPending,
    };
}
