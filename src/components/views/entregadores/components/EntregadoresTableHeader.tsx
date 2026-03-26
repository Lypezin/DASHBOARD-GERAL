import React from 'react';
import { EntregadorMarketing } from '@/types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface EntregadoresTableHeaderProps {
    sortField: keyof EntregadorMarketing | 'rodando';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof EntregadorMarketing | 'rodando') => void;
}

export const EntregadoresTableHeader = React.memo(function EntregadoresTableHeader({
    sortField,
    sortDirection,
    onSort,
}: EntregadoresTableHeaderProps) {
    const getSortIcon = (field: keyof EntregadorMarketing | 'rodando') => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-8 gap-4 px-6 py-3 min-w-[1000px]">
                <div
                    className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 col-span-2"
                    onClick={() => onSort('nome')}
                >
                    Entregador {getSortIcon('nome')}
                </div>
                <div
                    className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                    onClick={() => onSort('regiao_atuacao')}
                >
                    Praça {getSortIcon('regiao_atuacao')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('total_segundos')}
                >
                    Tempo {getSortIcon('total_segundos')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('total_ofertadas')}
                >
                    Ofertadas {getSortIcon('total_ofertadas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('total_aceitas')}
                >
                    Aceitas {getSortIcon('total_aceitas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('total_rejeitadas')}
                >
                    Rejeitadas {getSortIcon('total_rejeitadas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('total_completadas')}
                >
                    Completadas {getSortIcon('total_completadas')}
                </div>
            </div>
        </div>
    );
});
