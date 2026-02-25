import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Entregador } from '@/types';
import { EntregadoresMainTableHeader } from './components/EntregadoresMainTableHeader';
import { EntregadoresMainTableRow } from './components/EntregadoresMainTableRow';

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

    // Reset pagination when search term or sorting changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortField, sortDirection]);

    const totalPages = Math.ceil(sortedEntregadores.length / ITEMS_PER_PAGE);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return sortedEntregadores.slice(start, end);
    }, [sortedEntregadores, currentPage]);

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                Entregadores
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                Lista de entregadores e métricas
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-hidden">
                    <EntregadoresMainTableHeader
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    />

                    {/* Lista com scroll - Paginated */}
                    <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                        {currentItems.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {currentItems.map((entregador) => (
                                    <EntregadoresMainTableRow
                                        key={entregador.id_entregador}
                                        entregador={entregador}
                                        onClick={onRowClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                {searchTerm
                                    ? `Nenhum entregador encontrado com o termo "${searchTerm}"`
                                    : 'Nenhum entregador disponível'}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4">
                    <div className="text-sm text-slate-500">
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, sortedEntregadores.length)} de {sortedEntregadores.length} resultados
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <div className="text-sm font-medium px-2">
                            Página {currentPage} de {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
});
