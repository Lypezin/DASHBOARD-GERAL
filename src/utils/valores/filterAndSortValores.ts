import type { ValoresEntregador } from '@/types';

const valoresNameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function filterAndSortValores(
    rows: ValoresEntregador[],
    options: {
        searchTerm?: string;
        sortField?: keyof ValoresEntregador;
        sortDirection?: 'asc' | 'desc';
    } = {}
) {
    const normalizedSearch = (options.searchTerm || '').trim().toLowerCase();
    const sortField = options.sortField || 'total_taxas';
    const sortDirection = options.sortDirection || 'desc';
    const filtered = normalizedSearch
        ? rows.filter((row) => `${row.nome_entregador || ''} ${row.id_entregador || ''}`.toLowerCase().includes(normalizedSearch))
        : rows;

    return [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (
            sortField === 'nome_entregador'
            || sortField === 'id_entregador'
            || sortField === 'turno'
            || sortField === 'sub_praca'
        ) {
            const comparison = valoresNameCollator.compare(String(aValue).toLowerCase().trim(), String(bValue).toLowerCase().trim());
            if (comparison !== 0) return sortDirection === 'asc' ? comparison : -comparison;
            return valoresNameCollator.compare(a.id_entregador, b.id_entregador);
        }

        const comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
        if (comparison === 0) {
            const nameDifference = valoresNameCollator.compare(a.nome_entregador, b.nome_entregador);
            if (nameDifference !== 0) return nameDifference;
            return valoresNameCollator.compare(a.id_entregador, b.id_entregador);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });
}
