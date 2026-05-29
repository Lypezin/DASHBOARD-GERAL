import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

const ITEMS_PER_PAGE = 50;

export const EntregadoresMainTable = React.memo(function EntregadoresMainTable({
    sortedEntregadores,
    sortField,
    sortDirection,
    onSort,
    searchTerm,
    onRowClick,
}: EntregadoresMainTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortField, sortDirection]);

    const totalPages = Math.ceil(sortedEntregadores.length / ITEMS_PER_PAGE);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedEntregadores.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedEntregadores, currentPage]);

    return (
        <Card className="overflow-hidden border-slate-200/70 bg-white/92 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/86">
            <EntregadoresMainTableHeaderCard />

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="min-w-[1100px]">
                        <EntregadoresMainTableHeader
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={onSort}
                        />

                        <div className="max-h-[600px] overflow-y-auto">
                            {currentItems.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {currentItems.map((entregador, index) => (
                                        <EntregadoresMainTableRow
                                            key={`${entregador.id_entregador}-${index}`}
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
                                            : 'Nenhum entregador disponivel'}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Ajuste os filtros ou refine a busca para localizar registros.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            <EntregadoresPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedEntregadores.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </Card>
    );
});

EntregadoresMainTable.displayName = 'EntregadoresMainTable';
