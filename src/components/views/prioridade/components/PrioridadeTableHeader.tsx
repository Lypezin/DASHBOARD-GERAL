import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Entregador } from '@/types';

interface PrioridadeTableHeaderProps {
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

const SortIcon = ({
    field,
    currentField,
    direction
}: {
    field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    currentField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    direction: 'asc' | 'desc';
}) => {
    if (currentField !== field) {
        return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
    }
    return direction === 'asc' ?
        <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
        <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
};

export const PrioridadeTableHeader: React.FC<PrioridadeTableHeaderProps> = ({
    sortField,
    sortDirection,
    onSort
}) => {
    return (
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
                <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('nome_entregador')}
                >
                    Entregador <SortIcon field="nome_entregador" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('corridas_ofertadas')}
                >
                    Ofertadas <SortIcon field="corridas_ofertadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('corridas_aceitas')}
                >
                    Aceitas <SortIcon field="corridas_aceitas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('corridas_rejeitadas')}
                >
                    Rejeitadas <SortIcon field="corridas_rejeitadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('percentual_aceitas')}
                >
                    % Aceitas <SortIcon field="percentual_aceitas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('corridas_completadas')}
                >
                    Completadas <SortIcon field="corridas_completadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('percentual_completadas')}
                >
                    % Completadas <SortIcon field="percentual_completadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('aderencia_percentual')}
                >
                    Aderência <SortIcon field="aderencia_percentual" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                    className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    onClick={() => onSort('rejeicao_percentual')}
                >
                    % Rejeição <SortIcon field="rejeicao_percentual" currentField={sortField} direction={sortDirection} />
                </th>
            </tr>
        </thead>
    );
};
