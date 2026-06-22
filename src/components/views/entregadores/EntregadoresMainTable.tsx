import React, { useEffect, useMemo, useState } from 'react';
import { Entregador } from '@/types';
import { EntregadoresMainTableHeaderCard } from './components/EntregadoresMainTableHeaderCard';
import { EntregadoresMainTableHeader } from './components/EntregadoresMainTableHeader';
import { EntregadoresMainTableRow } from './components/EntregadoresMainTableRow';
import { EntregadoresPagination } from './components/EntregadoresPagination';

interface EntregadoresMainTableProps {
    sortedEntregadores: Entregador[];
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
    searchTerm: string;
    onRowClick?: (entregador: Entregador) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 50;
const HEAVY_DATASET_ITEMS_PER_PAGE = 35;
const VERY_HEAVY_DATASET_ITEMS_PER_PAGE = 24;

export const EntregadoresMainTable = React.memo(function EntregadoresMainTable({
    sortedEntregadores,
    sortField,
    sortDirection,
    onSort,
    searchTerm,
    onRowClick,
}: EntregadoresMainTableProps) {
    const itemsPerPage = sortedEntregadores.length > 1000
        ? VERY_HEAVY_DATASET_ITEMS_PER_PAGE
        : sortedEntregadores.length > 400
            ? HEAVY_DATASET_ITEMS_PER_PAGE
            : DEFAULT_ITEMS_PER_PAGE;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortField, sortDirection]);

    const totalPages = Math.ceil(sortedEntregadores.length / itemsPerPage);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedEntregadores.slice(start, start + itemsPerPage);
    }, [sortedEntregadores, currentPage, itemsPerPage]);

    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/75 bg-white/90 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.52)] ring-1 ring-slate-100/80 dark:border-slate-800/75 dark:bg-slate-950/80 dark:ring-slate-800/50">
            <EntregadoresMainTableHeaderCard />

            <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
                <div className="min-w-[1320px]">
                    <EntregadoresMainTableHeader
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    />

                    <div className="subtle-scrollbar max-h-[640px] overflow-y-auto">
                        {currentItems.length > 0 ? (
                            <div className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                                {currentItems.map((entregador) => (
                                    <EntregadoresMainTableRow
                                        key={entregador.id_entregador}
                                        entregador={entregador}
                                        onClick={onRowClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="px-6 py-14 text-center">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {searchTerm
                                        ? `Nenhum entregador encontrado com o termo "${searchTerm}"`
                                        : 'Nenhum entregador disponível'}
                                </p>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Ajuste os filtros ou refine a busca para localizar registros.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EntregadoresPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedEntregadores.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
});

EntregadoresMainTable.displayName = 'EntregadoresMainTable';
