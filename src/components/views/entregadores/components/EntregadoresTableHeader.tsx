
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EntregadorMarketing } from '@/types';

interface EntregadoresTableHeaderProps {
    sortField: keyof EntregadorMarketing | 'rodando';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof EntregadorMarketing | 'rodando') => void;
}

export const EntregadoresTableHeader: React.FC<EntregadoresTableHeaderProps> = ({
    sortField,
    sortDirection,
    onSort
}) => {
    const getSortIcon = (field: keyof EntregadorMarketing | 'rodando') => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-10 gap-4 px-6 py-3 min-w-[1200px]">
                <div
                    className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 col-span-2"
                    onClick={() => onSort('nome')}
                >
                    Nome / ID {getSortIcon('nome')}
                </div>
                <div
                    className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                    onClick={() => onSort('regiao_atuacao')}
                >
                    Cidade {getSortIcon('regiao_atuacao')}
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
                    onClick={() => onSort('total_completadas')}
                >
                    Completadas {getSortIcon('total_completadas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('total_rejeitadas')}
                >
                    Rejeitadas {getSortIcon('total_rejeitadas')}
                </div>
                <div
                    className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                    onClick={() => onSort('total_segundos')}
                >
                    Horas {getSortIcon('total_segundos')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('dias_sem_rodar')}
                >
                    Dias s/ Rodar {getSortIcon('dias_sem_rodar')}
                </div>
                <div
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                    onClick={() => onSort('rodando')}
                >
                    Status {getSortIcon('rodando')}
                </div>
            </div>
        </div>
    );
};
