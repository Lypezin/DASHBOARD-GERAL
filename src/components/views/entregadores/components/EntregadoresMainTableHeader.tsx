import React from 'react';
import { Entregador } from '@/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface EntregadoresTableHeaderProps {
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

type SortableField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';

export const EntregadoresMainTableHeader = React.memo(function EntregadoresMainTableHeader({
    sortField,
    sortDirection,
    onSort,
}: EntregadoresTableHeaderProps) {
    const getSortIcon = (field: SortableField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="inline h-3 w-3 text-slate-400" />;
        }

        return sortDirection === 'asc'
            ? <ArrowUp className="inline h-3 w-3 text-slate-900 dark:text-white" />
            : <ArrowDown className="inline h-3 w-3 text-slate-900 dark:text-white" />;
    };

    const HeaderCell = ({
        label,
        field,
        align = 'center',
        span = '',
    }: {
        label: string;
        field?: SortableField;
        align?: 'left' | 'center' | 'right';
        span?: string;
    }) => {
        const baseClass = 'text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400';
        const alignClass = align === 'left'
            ? 'justify-start text-left'
            : align === 'right'
                ? 'justify-end text-right'
                : 'justify-center text-center';

        if (!field) {
            return <div className={`${baseClass} ${alignClass} ${span}`}>{label}</div>;
        }

        return (
            <button
                type="button"
                onClick={() => onSort(field)}
                className={`${baseClass} ${alignClass} ${span} flex items-center gap-1 transition-colors hover:text-slate-800 dark:hover:text-slate-200`}
            >
                <span>{label}</span>
                {getSortIcon(field)}
            </button>
        );
    };

    return (
        <div className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="grid min-w-[1100px] grid-cols-10 gap-4 px-6 py-3">
                <HeaderCell label="Saúde" />
                <HeaderCell label="Nome" field="nome_entregador" align="left" span="col-span-2" />
                <HeaderCell label="Horas" field="total_segundos" />
                <HeaderCell label="Ofertadas" field="corridas_ofertadas" align="right" />
                <HeaderCell label="Aceitas" field="corridas_aceitas" align="right" />
                <HeaderCell label="% Aceitas" field="percentual_aceitas" />
                <HeaderCell label="Completadas" field="corridas_completadas" align="right" />
                <HeaderCell label="% Completadas" field="percentual_completadas" />
                <HeaderCell label="Aderência" field="aderencia_percentual" />
            </div>
        </div>
    );
});

EntregadoresMainTableHeader.displayName = 'EntregadoresMainTableHeader';
