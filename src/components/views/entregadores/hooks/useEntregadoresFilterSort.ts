import { useMemo, useCallback, useState } from 'react';
import { EntregadorMarketing } from '@/types';

export function useEntregadoresFilterSort(entregadores: EntregadorMarketing[], searchTerm: string) {
    const [sortField, setSortField] = useState<keyof EntregadorMarketing | 'rodando'>('total_completadas');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = useCallback((field: keyof EntregadorMarketing | 'rodando') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    }, [sortField]);

    const entregadoresFiltrados = useMemo(() => {
        let filtered = entregadores;

        if (searchTerm.trim()) {
            const termo = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(e =>
                e.nome.toLowerCase().includes(termo) ||
                e.id_entregador.toLowerCase().includes(termo)
            );
        }

        return [...filtered].sort((a, b) => {
            if (sortField === 'rodando') {
                const getRodandoValue = (e: EntregadorMarketing) => {
                    if (e.rodando) return e.rodando === 'Sim';
                    return (e.total_completadas || 0) > 30;
                };

                const rodandoA = getRodandoValue(a);
                const rodandoB = getRodandoValue(b);

                if (rodandoA === rodandoB) return 0;

                const valA = rodandoA ? 1 : 0;
                const valB = rodandoB ? 1 : 0;

                return sortDirection === 'asc' ? valA - valB : valB - valA;
            }

            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            const numA = Number(valA) || 0;
            const numB = Number(valB) || 0;

            return sortDirection === 'asc' ? numA - numB : numB - numA;
        });
    }, [entregadores, searchTerm, sortField, sortDirection]);

    return {
        sortField,
        sortDirection,
        setSortField,
        setSortDirection,
        handleSort,
        entregadoresFiltrados
    };
}
