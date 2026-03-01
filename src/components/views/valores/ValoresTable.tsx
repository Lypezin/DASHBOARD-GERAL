
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
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
    const lastElementRef = useInfiniteScroll(onLoadMore || (() => { }), hasMore || false, isLoadingMore || false);

    const SortIcon = ({ field }: { field: keyof ValoresEntregador }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
        }
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white" />;
    };

    const SortableHeader = ({ field, label, align = 'left', className = '' }: any) => (
        <TableHead className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`} onClick={() => onSort(field)}>
            <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>{label} <SortIcon field={field} /></div>
        </TableHead>
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800/50">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <SortableHeader field="nome_entregador" label="Entregador" className="w-[300px] pl-6" />
                        {isDetailed && (
                            <>
                                <SortableHeader field="turno" label="Turno" />
                                <SortableHeader field="sub_praca" label="Sub-Praça" />
                            </>
                        )}
                        <SortableHeader field="total_taxas" label="Total" align="right" />
                        <SortableHeader field="numero_corridas_aceitas" label="Corridas" align="right" />
                        <SortableHeader field="taxa_media" label="Média" align="right" className="pr-6" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedValores.length > 0 ? (
                        <>
                            {sortedValores.map((entregador, index) => entregador && (
                                <ValoresTableRow key={`${entregador.id_entregador}-${index}`} entregador={entregador} ranking={index + 1} formatarReal={formatarReal} isDetailed={isDetailed} />
                            ))}
                            {hasMore && (
                                <TableRow>
                                    <TableCell colSpan={isDetailed ? 6 : 4} className="h-12 text-center py-4">
                                        <div ref={lastElementRef} className="flex justify-center items-center gap-2 text-slate-500">
                                            {isLoadingMore ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div> : <span className="text-xs">Carregando mais...</span>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    ) : (
                        <TableRow><TableCell colSpan={isDetailed ? 6 : 4} className="h-24 text-center">Nenhum dado encontrado.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
});
