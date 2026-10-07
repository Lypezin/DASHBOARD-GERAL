import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Entregador } from '@/types';

type SortField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';

interface PrioridadeTableHeaderProps {
    sortField: SortField;
    sortDirection: 'asc' | 'desc';
    onSort: (field: SortField) => void;
}

export const PrioridadeTableHeader = React.memo<PrioridadeTableHeaderProps>(({
    sortField,
    sortDirection,
    onSort,
}) => (
    <thead className="sticky top-0 z-10 border-b border-[#d8e4eb] bg-[#f4f8fa] dark:border-slate-700 dark:bg-slate-900">
        <tr>
            <SortHeader label="Entregador" field="nome_entregador" currentField={sortField} direction={sortDirection} onSort={onSort} align="left" />
            <SortHeader label="Ofertadas" field="corridas_ofertadas" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="Aceitas" field="corridas_aceitas" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="Rejeitadas" field="corridas_rejeitadas" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="% Aceitas" field="percentual_aceitas" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="Completadas" field="corridas_completadas" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="% Completadas" field="percentual_completadas" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="Aderência" field="aderencia_percentual" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortHeader label="% Rejeição" field="rejeicao_percentual" currentField={sortField} direction={sortDirection} onSort={onSort} />
        </tr>
    </thead>
));

PrioridadeTableHeader.displayName = 'PrioridadeTableHeader';

function SortHeader({
    label,
    field,
    currentField,
    direction,
    onSort,
    align = 'center',
}: {
    label: string;
    field: SortField;
    currentField: SortField;
    direction: 'asc' | 'desc';
    onSort: (field: SortField) => void;
    align?: 'left' | 'center';
}) {
    const isActive = currentField === field;

    return (
        <th
            scope="col"
            aria-sort={isActive ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}
            className={`whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:px-4 ${align === 'left' ? 'text-left' : 'text-center'}`}
        >
            <button
                type="button"
                onClick={() => onSort(field)}
                aria-label={`Ordenar por ${label}`}
                className={`inline-flex items-center gap-1 rounded-sm transition-colors duration-150 hover:text-[#174d70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] dark:hover:text-sky-200 ${align === 'left' ? 'justify-start' : 'justify-center'}`}
            >
                {label}
                {isActive ? (
                    direction === 'asc'
                        ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                ) : <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
            </button>
        </th>
    );
}
