import React from 'react';
import { Entregador } from '@/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface EntregadoresTableHeaderProps {
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

type SortableField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';

export const ENTREGADORES_TABLE_GRID = 'grid-cols-[88px_minmax(280px,2fr)_130px_120px_120px_120px_135px_140px_120px]';

export const EntregadoresMainTableHeader = React.memo(function EntregadoresMainTableHeader({
    sortField,
    sortDirection,
    onSort,
}: EntregadoresTableHeaderProps) {
    const getSortIcon = (field: SortableField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />;
        }

        return sortDirection === 'asc'
            ? <ArrowUp className="h-3.5 w-3.5 shrink-0 text-slate-900 dark:text-white" />
            : <ArrowDown className="h-3.5 w-3.5 shrink-0 text-slate-900 dark:text-white" />;
    };

    const HeaderCell = ({
        label,
        field,
        align = 'center',
    }: {
        label: string;
        field?: SortableField;
        align?: 'left' | 'center' | 'right';
    }) => {
        const baseClass = 'min-w-0 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400';
        const alignClass = align === 'left'
            ? 'justify-start text-left'
            : align === 'right'
                ? 'justify-end text-right'
                : 'justify-center text-center';

        if (!field) {
            return <div className={`${baseClass} ${alignClass} flex items-center`} title={label}>{label}</div>;
        }

        return (
            <button
                type="button"
                onClick={() => onSort(field)}
                className={`${baseClass} ${alignClass} flex items-center gap-1.5 rounded-lg px-1 py-1 transition-colors hover:text-slate-900 dark:hover:text-slate-100`}
                title={`Ordenar por ${label}`}
            >
                <span className="min-w-0 whitespace-normal leading-tight">{label}</span>
                {getSortIcon(field)}
            </button>
        );
    };

    return (
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className={`grid ${ENTREGADORES_TABLE_GRID} items-center gap-4 px-6 py-3`}>
                <HeaderCell label="Saúde" />
                <HeaderCell label="Nome" field="nome_entregador" align="left" />
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
