import React from 'react';
import { Entregador } from '@/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface EntregadoresTableHeaderProps {
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
    variant?: 'entregadores' | 'dedicado';
}

type SortableField = keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';

export const ENTREGADORES_TABLE_GRID = 'grid-cols-[88px_minmax(280px,2fr)_130px_120px_120px_120px_135px_140px_120px]';
export const ENTREGADORES_OPERATIONAL_TABLE_GRID = 'grid-cols-[58px_minmax(230px,1.8fr)_110px_90px_90px_95px_110px_105px_100px]';

export const EntregadoresMainTableHeader = React.memo(function EntregadoresMainTableHeader({
    sortField,
    sortDirection,
    onSort,
    variant = 'entregadores',
}: EntregadoresTableHeaderProps) {
    const isEntregadores = variant === 'entregadores';
    const gridClass = isEntregadores ? ENTREGADORES_OPERATIONAL_TABLE_GRID : ENTREGADORES_TABLE_GRID;

    const getSortIcon = (field: SortableField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />;
        }

        const activeClass = isEntregadores ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white';
        return sortDirection === 'asc'
            ? <ArrowUp className={`h-3.5 w-3.5 shrink-0 ${activeClass}`} />
            : <ArrowDown className={`h-3.5 w-3.5 shrink-0 ${activeClass}`} />;
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
        const baseClass = isEntregadores
            ? 'min-w-0 text-[11px] font-semibold uppercase tracking-[0.025em]'
            : 'min-w-0 text-[11px] font-black uppercase tracking-[0.14em]';
        const alignClass = align === 'left'
            ? 'justify-start text-left'
            : align === 'right'
                ? 'justify-end text-right'
                : 'justify-center text-center';

        if (!field) {
            return <div className={`${baseClass} ${alignClass} flex items-center text-slate-500 dark:text-slate-400`} title={label}>{label}</div>;
        }

        const isActive = sortField === field;

        return (
            <button
                type="button"
                onClick={() => onSort(field)}
                aria-pressed={isActive}
                className={`${baseClass} ${alignClass} flex items-center gap-1.5 rounded-lg ${isEntregadores ? 'px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40' : 'px-1 py-1'} transition-colors ${isEntregadores
                    ? isActive
                        ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                title={`Ordenar por ${label}`}
            >
                <span className="min-w-0 whitespace-normal leading-tight">{label}</span>
                {getSortIcon(field)}
            </button>
        );
    };

    return (
        <div className={isEntregadores
            ? 'sticky top-0 z-20 border-b border-[#d6dcd5] bg-[#eef1ec] dark:border-slate-700 dark:bg-slate-800'
            : 'sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95'}>
            <div className={`grid ${gridClass} items-center ${isEntregadores ? 'gap-3 px-4 py-2.5' : 'gap-4 px-6 py-3'}`}>
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
