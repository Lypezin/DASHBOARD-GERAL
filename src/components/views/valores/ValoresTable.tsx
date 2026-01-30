
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

interface ValoresTableProps {
    sortedValores: ValoresEntregador[];
    sortField: keyof ValoresEntregador;
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof ValoresEntregador) => void;
    formatarReal: (valor: number | null | undefined) => string;
    isDetailed?: boolean;
}

export const ValoresTable = React.memo(function ValoresTable({
    sortedValores,
    sortField,
    sortDirection,
    onSort,
    formatarReal,
    isDetailed,
}: ValoresTableProps) {

    const SortIcon = ({ field }: { field: keyof ValoresEntregador }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
        }
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white" />;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800/50">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="w-[300px] pl-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => onSort('nome_entregador')}>
                            <div className="flex items-center gap-2">
                                Entregador
                                <SortIcon field="nome_entregador" />
                            </div>
                        </TableHead>
                        {isDetailed && (
                            <>
                                <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => onSort('turno')}>
                                    <div className="flex items-center gap-2">
                                        Turno
                                        <SortIcon field="turno" />
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => onSort('sub_praca')}>
                                    <div className="flex items-center gap-2">
                                        Sub-Praça
                                        <SortIcon field="sub_praca" />
                                    </div>
                                </TableHead>
                            </>
                        )}
                        <TableHead className="text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => onSort('total_taxas')}>
                            <div className="flex items-center justify-end gap-2">
                                Total
                                <SortIcon field="total_taxas" />
                            </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => onSort('numero_corridas_aceitas')}>
                            <div className="flex items-center justify-end gap-2">
                                Corridas
                                <SortIcon field="numero_corridas_aceitas" />
                            </div>
                        </TableHead>
                        <TableHead className="text-right pr-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => onSort('taxa_media')}>
                            <div className="flex items-center justify-end gap-2">
                                Média
                                <SortIcon field="taxa_media" />
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedValores.length > 0 ? (
                        sortedValores.map((entregador, index) => {
                            if (!entregador) return null;
                            return (
                                <ValoresTableRow
                                    key={`${entregador.id_entregador}-${index}`}
                                    entregador={entregador}
                                    ranking={index + 1}
                                    formatarReal={formatarReal}
                                    isDetailed={isDetailed}
                                />
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhum dado encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
});
