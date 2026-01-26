
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { formatDuration, extractWeekNumber } from '@/utils/timeHelpers';
import { calculatePercentage } from '@/utils/formatHelpers';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface ComparacaoRow {
    semana_iso: string;
    segundos_ops: number;
    segundos_mkt: number;
    ofertadas_ops: number;
    ofertadas_mkt: number;
    aceitas_ops: number;
    aceitas_mkt: number;
    concluidas_ops: number;
    concluidas_mkt: number;
    rejeitadas_ops: number;
    rejeitadas_mkt: number;
    valor_ops?: number;
    valor_mkt?: number;
    entregadores_ops?: number;
    entregadores_mkt?: number;
}

interface MarketingComparacaoRowProps {
    row: ComparacaoRow;
    onSelectWeek: (semana_iso: string) => void;
}

// ... imports

export const MarketingComparacaoRow = React.memo(function MarketingComparacaoRow({ row, onSelectWeek }: MarketingComparacaoRowProps) {
    const totalHours = row.segundos_ops + row.segundos_mkt;

    return (
        <TableRow className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 border-b border-slate-50 dark:border-slate-800/50 group">
            <TableCell className="font-medium whitespace-nowrap pl-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">
                        S{extractWeekNumber(row.semana_iso)}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-center py-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500"
                    onClick={() => onSelectWeek(row.semana_iso)}
                    title="Ver detalhes"
                >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                </Button>
            </TableCell>

            {/* Entregadores */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-3 px-1">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 text-xs">{(row.entregadores_ops || 0).toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-indigo-400/70">{calculatePercentage(row.entregadores_ops || 0, (row.entregadores_ops || 0) + (row.entregadores_mkt || 0))}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-3 px-1">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{(row.entregadores_mkt || 0).toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/70">{calculatePercentage(row.entregadores_mkt || 0, (row.entregadores_ops || 0) + (row.entregadores_mkt || 0))}</span>
                </div>
            </TableCell>

            {/* Hours */}
            <TableCell className="text-right font-mono border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">{formatDuration(row.segundos_ops)}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.segundos_ops, row.segundos_ops + row.segundos_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right font-mono align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-purple-600 dark:text-purple-400 text-xs">{formatDuration(row.segundos_mkt)}</span>
                    <span className="text-[10px] text-purple-500/70">{calculatePercentage(row.segundos_mkt, row.segundos_ops + row.segundos_mkt)}</span>
                </div>
            </TableCell>

            {/* Ofertadas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">{row.ofertadas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.ofertadas_ops, row.ofertadas_ops + row.ofertadas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{row.ofertadas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/70">{calculatePercentage(row.ofertadas_mkt, row.ofertadas_ops + row.ofertadas_mkt)}</span>
                </div>
            </TableCell>

            {/* Aceitas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">{row.aceitas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.aceitas_ops, row.aceitas_ops + row.aceitas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{row.aceitas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/70">{calculatePercentage(row.aceitas_mkt, row.aceitas_ops + row.aceitas_mkt)}</span>
                </div>
            </TableCell>

            {/* Completas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">{row.concluidas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.concluidas_ops, row.concluidas_ops + row.concluidas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{row.concluidas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/70">{calculatePercentage(row.concluidas_mkt, row.concluidas_ops + row.concluidas_mkt)}</span>
                </div>
            </TableCell>

            {/* Rejeitadas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-rose-600/70 dark:text-rose-400/70 text-xs">{row.rejeitadas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-rose-400/70">{calculatePercentage(row.rejeitadas_ops, row.rejeitadas_ops + row.rejeitadas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{row.rejeitadas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/70">{calculatePercentage(row.rejeitadas_mkt, row.rejeitadas_ops + row.rejeitadas_mkt)}</span>
                </div>
            </TableCell>



            {/* Valor */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_ops || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {calculatePercentage(row.valor_ops || 0, (row.valor_ops || 0) + (row.valor_mkt || 0))}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-4 pr-6">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_mkt || 0)}
                    </span>
                    <span className="text-[10px] text-purple-500/70">
                        {calculatePercentage(row.valor_mkt || 0, (row.valor_ops || 0) + (row.valor_mkt || 0))}
                    </span>
                </div>
            </TableCell>
        </TableRow>
    );
});
