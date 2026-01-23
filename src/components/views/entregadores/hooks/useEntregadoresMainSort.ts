import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Entregador, EntregadoresData } from '@/types';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';

export function useEntregadoresMainSort(entregadoresData: EntregadoresData | null) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Init from URL
    const getInitialSortField = () => {
        return (searchParams.get('ent_sort') as any) || 'aderencia_percentual';
    };
    const getInitialSortDirection = () => {
        return (searchParams.get('ent_dir') as 'asc' | 'desc') || 'desc';
    };
    const getInitialSearchTerm = () => {
        return searchParams.get('ent_search') || '';
    };

    const [sortField, setSortField] = useState<keyof Entregador | 'percentual_aceitas' | 'percentual_completadas'>(getInitialSortField);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(getInitialSortDirection);
    const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (sortField !== 'aderencia_percentual') {
            if (params.get('ent_sort') !== sortField) { params.set('ent_sort', sortField); changed = true; }
        } else if (params.has('ent_sort')) { params.delete('ent_sort'); changed = true; }

        if (sortDirection !== 'desc') {
            if (params.get('ent_dir') !== sortDirection) { params.set('ent_dir', sortDirection); changed = true; }
        } else if (params.has('ent_dir')) { params.delete('ent_dir'); changed = true; }

        if (searchTerm) {
            if (params.get('ent_search') !== searchTerm) { params.set('ent_search', searchTerm); changed = true; }
        } else if (params.has('ent_search')) { params.delete('ent_search'); changed = true; }

        if (changed) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [sortField, sortDirection, searchTerm, pathname, router, searchParams]);

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
