
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
}

interface MarketingComparacaoRowProps {
    row: ComparacaoRow;
    onSelectWeek: (semana_iso: string) => void;
}

// ... imports

export const MarketingComparacaoRow = React.memo(function MarketingComparacaoRow({ row, onSelectWeek }: MarketingComparacaoRowProps) {
    const totalHours = row.segundos_ops + row.segundos_mkt;

    return (
        <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <TableCell className="font-medium whitespace-nowrap pl-6">
                Semana {extractWeekNumber(row.semana_iso)}
            </TableCell>
            <TableCell className="text-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => onSelectWeek(row.semana_iso)}
                    title="Ver detalhes"
                >
                    <Search className="h-4 w-4 text-slate-400 hover:text-blue-500 transition-colors" />
                    <span className="sr-only">Ver detalhes</span>
                </Button>
            </TableCell>

            {/* Hours */}
            <TableCell className="text-right font-mono border-l border-slate-100 dark:border-slate-800 align-top py-3 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{formatDuration(row.segundos_ops)}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{calculatePercentage(row.segundos_ops, totalHours)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right font-mono border-r border-slate-100 dark:border-slate-800 align-top py-3 bg-blue-50/20 dark:bg-blue-900/5">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{formatDuration(row.segundos_mkt)}</span>
                    <span className="text-[10px] text-indigo-500/80 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full font-medium">{calculatePercentage(row.segundos_mkt, totalHours)}</span>
                </div>
            </TableCell>

            {/* Ofertadas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{row.ofertadas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.ofertadas_ops, row.ofertadas_ops + row.ofertadas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{row.ofertadas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-indigo-500/80 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full font-medium">{calculatePercentage(row.ofertadas_mkt, row.ofertadas_ops + row.ofertadas_mkt)}</span>
                </div>
            </TableCell>

            {/* Aceitas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{row.aceitas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.aceitas_ops, row.aceitas_ops + row.aceitas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{row.aceitas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-indigo-500/80 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full font-medium">{calculatePercentage(row.aceitas_mkt, row.aceitas_ops + row.aceitas_mkt)}</span>
                </div>
            </TableCell>

            {/* Completas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{row.concluidas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.concluidas_ops, row.concluidas_ops + row.concluidas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{row.concluidas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-indigo-500/80 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full font-medium">{calculatePercentage(row.concluidas_mkt, row.concluidas_ops + row.concluidas_mkt)}</span>
                </div>
            </TableCell>

            {/* Rejeitadas */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{row.rejeitadas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.rejeitadas_ops, row.rejeitadas_ops + row.rejeitadas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-3">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{row.rejeitadas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-indigo-500/80 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full font-medium">{calculatePercentage(row.rejeitadas_mkt, row.rejeitadas_ops + row.rejeitadas_mkt)}</span>
                </div>
            </TableCell>

            {/* Valor */}
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-top py-3 bg-amber-50/20 dark:bg-amber-900/5">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_ops || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400">{calculatePercentage(row.valor_ops || 0, (row.valor_ops || 0) + (row.valor_mkt || 0))}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-3 bg-amber-50/10 dark:bg-amber-900/5 pr-6">
                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_mkt || 0)}
                    </span>
                    <span className="text-[10px] text-indigo-500/80 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full font-medium">
                        {calculatePercentage(row.valor_mkt || 0, (row.valor_ops || 0) + (row.valor_mkt || 0))}
                    </span>
                </div>
            </TableCell>
        </TableRow>
    );
});
