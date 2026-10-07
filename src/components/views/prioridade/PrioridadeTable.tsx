import React from 'react';
import { Entregador } from '@/types';
import { Users } from 'lucide-react';
import { PrioridadeTableHeader } from './components/PrioridadeTableHeader';
import { PrioridadeTableRow } from './components/PrioridadeTableRow';

interface PrioridadeTableProps {
    sortedEntregadores: Entregador[];
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    hasMore: boolean;
    onLoadMore: () => void;
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

export const PrioridadeTable = React.memo<PrioridadeTableProps>(({
    sortedEntregadores,
    sortField,
    sortDirection,
    hasMore,
    onLoadMore,
    onSort,
}) => {
    return (
        <section aria-labelledby="prioridade-table-title" className="overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-950/80">
            <header className="flex min-w-0 items-center gap-2.5 border-b border-[#e2ebf0] px-4 py-3.5 dark:border-slate-800 sm:px-5">
                <Users className="h-4 w-4 shrink-0 text-[#38708e] dark:text-sky-300" aria-hidden="true" />
                <div className="min-w-0">
                    <h2 id="prioridade-table-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
                        Entregadores por desempenho
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Selecione uma coluna para ordenar os resultados.
                    </p>
                </div>
            </header>

            <div className="p-0">
                <div className="subtle-scrollbar max-h-[600px] overflow-auto">
                    <table className="w-full min-w-[960px]">
                        <PrioridadeTableHeader
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={onSort}
                        />
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedEntregadores.map((entregador) => (
                                <PrioridadeTableRow
                                    key={entregador.id_entregador}
                                    entregador={entregador}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                {hasMore && (
                    <div className="flex justify-center border-t border-[#e2ebf0] bg-[#f6f9fb] p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                        <button
                            type="button"
                            onClick={onLoadMore}
                            className="rounded-lg border border-[#d8e4eb] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-[#afc5d1] hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            Carregar mais resultados
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
});

PrioridadeTable.displayName = 'PrioridadeTable';
