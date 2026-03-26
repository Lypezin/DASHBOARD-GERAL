import React from 'react';
import { Entregador } from '@/types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface EntregadoresTableHeaderProps {
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

export const EntregadoresMainTableHeader = React.memo(function EntregadoresMainTableHeader({
    sortField,
    sortDirection,
    onSort,
}: EntregadoresTableHeaderProps) {
    const getSortIcon = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-10 gap-4 px-6 py-3 min-w-[1100px]">
                <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Saúde
                </div>
                <div
                    className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 col-span-2"
                    onClick={() => onSort('nome_entregador')}
                >
                    Nome {getSortIcon('nome_entregador')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('total_segundos')}
                >
                    Horas {getSortIcon('total_segundos')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('corridas_ofertadas')}
                >
                    Ofertadas {getSortIcon('corridas_ofertadas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('corridas_aceitas')}
                >
                    Aceitas {getSortIcon('corridas_aceitas')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('percentual_aceitas')}
                >
                    % Aceitas {getSortIcon('percentual_aceitas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('corridas_completadas')}
                >
                    Completadas {getSortIcon('corridas_completadas')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('percentual_completadas')}
                >
                    % Completadas {getSortIcon('percentual_completadas')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('aderencia_percentual')}
                >
                    Aderência {getSortIcon('aderencia_percentual')}
                </div>
            </div>
        </div>
    );
});
