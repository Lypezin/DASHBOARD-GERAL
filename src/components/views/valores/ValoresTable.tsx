import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ValoresEntregador } from '@/types';
import { ValoresTableRow } from './components/ValoresTableRow';
import { useInfiniteScroll } from '@/hooks/ui/useInfiniteScroll';

interface ValoresTableProps {
    sortedValores: ValoresEntregador[];
    sortField: keyof ValoresEntregador;
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof ValoresEntregador) => void;
    formatarReal: (valor: number | null | undefined) => string;
    isDetailed?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
}

interface ValoresSortableHeaderProps {
    field: keyof ValoresEntregador;
    label: string;
    sortField: keyof ValoresEntregador;
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof ValoresEntregador) => void;
    align?: 'left' | 'right';
    className?: string;
}

const ValoresSortIcon = React.memo(function ValoresSortIcon({
    field,
    sortField,
    sortDirection,
}: Pick<ValoresSortableHeaderProps, 'field' | 'sortField' | 'sortDirection'>) {
    if (sortField !== field) {
        return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
    }

    return sortDirection === 'asc'
        ? <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white" />
        : <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white" />;
});

const ValoresSortableHeader = React.memo(function ValoresSortableHeader({
    field,
    label,
    sortField,
    sortDirection,
    onSort,
    align = 'left',
    className = ''
}: ValoresSortableHeaderProps) {
    return (
        <TableHead
            className={`cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
            onClick={() => onSort(field)}
        >
            <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
                {label}
                <ValoresSortIcon field={field} sortField={sortField} sortDirection={sortDirection} />
            </div>
        </TableHead>
    );
});

const noopLoadMore = () => {};

export const ValoresTable = React.memo(function ValoresTable({
    sortedValores,
    sortField,
    sortDirection,
    onSort,
    formatarReal,
    isDetailed,
    onLoadMore,
    hasMore,
    isLoadingMore
}: ValoresTableProps) {
    const lastElementRef = useInfiniteScroll(onLoadMore || noopLoadMore, hasMore || false, isLoadingMore || false);

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.52)] ring-1 ring-slate-100/80 dark:border-slate-800/70 dark:bg-slate-900/80 dark:ring-slate-800/50">
            <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
                <Table className={isDetailed ? "min-w-[920px]" : "min-w-[720px]"}>
                    <TableHeader>
                        <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80">
                            <ValoresSortableHeader field="nome_entregador" label="Entregador" sortField={sortField} sortDirection={sortDirection} onSort={onSort} className="w-[300px] pl-6" />
                            {isDetailed ? (
                                <>
                                    <ValoresSortableHeader field="turno" label="Turno" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
                                    <ValoresSortableHeader field="sub_praca" label="Sub-pra\u00e7a" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
                                </>
                            ) : null}
                            <ValoresSortableHeader field="total_taxas" label="Total" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" />
                            <ValoresSortableHeader field="numero_corridas_aceitas" label="Corridas" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" />
                            <ValoresSortableHeader field="taxa_media" label="Média" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" className="pr-6" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedValores.length > 0 ? (
                            <>
                                {sortedValores.map((entregador, index) => (
                                    entregador ? (
                                        <ValoresTableRow
                                            key={isDetailed
                                                ? `${entregador.id_entregador}-${entregador.turno || 'sem-turno'}-${entregador.sub_praca || 'sem-subpraca'}`
                                                : `${entregador.id_entregador}`
                                            }
                                            entregador={entregador}
                                            ranking={index + 1}
                                            formatarReal={formatarReal}
                                            isDetailed={isDetailed}
                                        />
                                    ) : null
                                ))}

                                {hasMore ? (
                                    <TableRow>
                                        <TableCell colSpan={isDetailed ? 6 : 4} className="h-12 py-4 text-center">
                                            <div ref={lastElementRef} className="flex items-center justify-center gap-2 text-slate-500">
                                                {isLoadingMore
                                                    ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-600" />
                                                    : <span className="text-xs">Carregando mais...</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isDetailed ? 6 : 4} className="h-24 text-center">
                                    Nenhum dado encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});
