import React, { useEffect, useMemo, useState } from 'react';
import { Entregador } from '@/types';
import { EntregadoresMainTableHeaderCard } from './components/EntregadoresMainTableHeaderCard';
import { EntregadoresMainTableHeader } from './components/EntregadoresMainTableHeader';
import { EntregadoresMainTableRow } from './components/EntregadoresMainTableRow';
import { EntregadoresPagination } from './components/EntregadoresPagination';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface EntregadoresMainTableProps {
    sortedEntregadores: Entregador[];
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
    searchTerm: string;
    onRowClick?: (entregador: Entregador) => void;
    isUpdating?: boolean;
    serverPagination?: {
        currentPage: number;
        loadedPage?: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
    };
    variant?: 'entregadores' | 'dedicado';
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
    isUpdating = false,
    serverPagination,
    variant = 'entregadores',
}: EntregadoresMainTableProps) {
    const shouldReduceMotion = useReducedMotion() ?? true;
    const itemsPerPage = sortedEntregadores.length > 1000
        ? VERY_HEAVY_DATASET_ITEMS_PER_PAGE
        : sortedEntregadores.length > 400
            ? HEAVY_DATASET_ITEMS_PER_PAGE
            : DEFAULT_ITEMS_PER_PAGE;
    const [localCurrentPage, setLocalCurrentPage] = useState(1);

    useEffect(() => {
        setLocalCurrentPage(1);
    }, [searchTerm, sortField, sortDirection]);

    const pageSize = serverPagination?.pageSize ?? itemsPerPage;
    const currentPage = serverPagination
        ? isUpdating
            ? serverPagination.loadedPage ?? serverPagination.currentPage
            : serverPagination.currentPage
        : localCurrentPage;
    const totalItems = serverPagination?.totalItems ?? sortedEntregadores.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const currentItems = useMemo(() => {
        if (serverPagination) return sortedEntregadores;
        const start = (currentPage - 1) * pageSize;
        return sortedEntregadores.slice(start, start + pageSize);
    }, [serverPagination, sortedEntregadores, currentPage, pageSize]);
    const pageContentKey = `${currentPage}:${sortField}:${sortDirection}:${searchTerm}:${currentItems.map((item) => item.id_entregador).join('|')}`;

    return (
        <div aria-busy={isUpdating} className="overflow-hidden rounded-[2rem] border border-slate-200/75 bg-white/90 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.52)] ring-1 ring-slate-100/80 dark:border-slate-800/75 dark:bg-slate-950/80 dark:ring-slate-800/50">
            <EntregadoresMainTableHeaderCard variant={variant} />

            <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
                <div className="min-w-[1320px]">
                    <EntregadoresMainTableHeader
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        variant={variant}
                    />

                    <div className="subtle-scrollbar max-h-[640px] overflow-y-auto">
                        <AnimatePresence mode="wait" initial={false}>
                            {currentItems.length > 0 ? (
                                <motion.div
                                    key={pageContentKey}
                                    initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -3, pointerEvents: 'none' }}
                                    transition={{ duration: shouldReduceMotion ? 0.08 : 0.16, ease: 'easeOut' }}
                                    className="divide-y divide-slate-100/80 dark:divide-slate-800/80"
                                >
                                    {currentItems.map((entregador) => (
                                        <EntregadoresMainTableRow
                                            key={entregador.id_entregador}
                                            entregador={entregador}
                                            variant={variant}
                                            onClick={isUpdating ? undefined : onRowClick}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={`empty:${currentPage}:${searchTerm}`}
                                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: shouldReduceMotion ? 0.08 : 0.14, ease: 'easeOut' }}
                                    className="px-6 py-14 text-center"
                                >
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        {searchTerm
                                            ? `Nenhum entregador encontrado com o termo "${searchTerm}"`
                                            : 'Nenhum entregador disponível'}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Ajuste os filtros ou refine a busca para localizar registros.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <EntregadoresPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                isUpdating={isUpdating}
                onPageChange={serverPagination?.onPageChange ?? setLocalCurrentPage}
            />
        </div>
    );
});

EntregadoresMainTable.displayName = 'EntregadoresMainTable';
