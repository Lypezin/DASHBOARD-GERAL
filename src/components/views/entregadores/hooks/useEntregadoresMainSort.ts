import { useCallback, useState, useMemo, useEffect, useDeferredValue, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Entregador, EntregadoresData } from '@/types';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';

type EntregadoresSortField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';

const VALID_SORT_FIELDS: EntregadoresSortField[] = [
    'id_entregador',
    'nome_entregador',
    'corridas_ofertadas',
    'corridas_aceitas',
    'corridas_rejeitadas',
    'corridas_completadas',
    'aderencia_percentual',
    'rejeicao_percentual',
    'total_segundos',
    'percentual_aceitas',
    'percentual_completadas',
];

const stringCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function useEntregadoresMainSort(entregadoresData: EntregadoresData | null, searchTerm: string) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const getInitialSortField = (): EntregadoresSortField => {
        const sort = searchParams.get('ent_sort');
        return sort && VALID_SORT_FIELDS.includes(sort as EntregadoresSortField)
            ? (sort as EntregadoresSortField)
            : 'aderencia_percentual';
    };
    const getInitialSortDirection = () => (searchParams.get('ent_dir') as 'asc' | 'desc') || 'desc';

    const [sortField, setSortFieldState] = useState<EntregadoresSortField>(getInitialSortField);
    const [sortDirection, setSortDirectionState] = useState<'asc' | 'desc'>(getInitialSortDirection);
    const [showInactiveOnly, setShowInactiveOnlyState] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (sortField !== 'aderencia_percentual') {
            if (params.get('ent_sort') !== sortField) { params.set('ent_sort', sortField); changed = true; }
        } else if (params.has('ent_sort')) { params.delete('ent_sort'); changed = true; }

        if (sortDirection !== 'desc') {
            if (params.get('ent_dir') !== sortDirection) { params.set('ent_dir', sortDirection); changed = true; }
        } else if (params.has('ent_dir')) { params.delete('ent_dir'); changed = true; }

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

    const indexedEntregadores = useMemo(() => {
        if (!entregadoresData?.entregadores) return [];

        return entregadoresData.entregadores.map((entregador) => ({
            entregador,
            searchText: `${entregador.nome_entregador || ''} ${entregador.id_entregador || ''}`.toLowerCase(),
        }));
    }, [entregadoresData]);

    const sortedEntregadores: Entregador[] = useMemo(() => {
        if (indexedEntregadores.length === 0) return [];

        let filtered = indexedEntregadores;
        const normalizedTerm = deferredSearchTerm.trim().toLowerCase();

        if (normalizedTerm) {
            filtered = filtered.filter(({ searchText }) => searchText.includes(normalizedTerm));
        }

        let filteredEntregadores = filtered.map(({ entregador }) => entregador);

        if (showInactiveOnly) filteredEntregadores = filteredEntregadores.filter(e => (e.corridas_completadas || 0) === 0);

        return [...filteredEntregadores].sort((a, b) => {
            let aVal: number | string = 0, bVal: number | string = 0;
            if (sortField === 'percentual_aceitas') { aVal = calcularPercentualAceitas(a); bVal = calcularPercentualAceitas(b); }
            else if (sortField === 'percentual_completadas') { aVal = calcularPercentualCompletadas(a); bVal = calcularPercentualCompletadas(b); }
            else { aVal = a[sortField] ?? 0; bVal = b[sortField] ?? 0; }

            if (typeof aVal === 'string' && typeof bVal === 'string') return sortDirection === 'asc' ? stringCollator.compare(aVal, bVal) : stringCollator.compare(bVal, aVal);
            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });

    }, [deferredSearchTerm, indexedEntregadores, showInactiveOnly, sortDirection, sortField]);

    const setShowInactiveOnly = useCallback((value: boolean) => {
        startTransition(() => {
            setShowInactiveOnlyState(value);
        });
    }, []);

    const handleSort = useCallback((field: EntregadoresSortField) => {
        startTransition(() => {
            if (sortField === field) setSortDirectionState(sortDirection === 'asc' ? 'desc' : 'asc');
            else {
                setSortFieldState(field);
                setSortDirectionState('desc');
            }
        });
    }, [sortDirection, sortField]);

    return { sortedEntregadores, sortField, sortDirection, showInactiveOnly, setShowInactiveOnly, handleSort, isFilteringDeferred: isPending || deferredSearchTerm !== searchTerm };
}
