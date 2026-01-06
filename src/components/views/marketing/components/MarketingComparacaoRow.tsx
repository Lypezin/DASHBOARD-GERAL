
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
}

interface MarketingComparacaoRowProps {
    row: ComparacaoRow;
    onSelectWeek: (semana_iso: string) => void;
}

export const MarketingComparacaoRow = React.memo(function MarketingComparacaoRow({ row, onSelectWeek }: MarketingComparacaoRowProps) {
    const totalHours = row.segundos_ops + row.segundos_mkt;

    return (
        <TableRow>
            <TableCell className="font-medium whitespace-nowrap">
                Semana {extractWeekNumber(row.semana_iso)}
            </TableCell>
            <TableCell className="text-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onSelectWeek(row.semana_iso)}
                    title="Ver detalhes"
                >
                    <Search className="h-4 w-4 text-slate-500 hover:text-blue-500" />
                    <span className="sr-only">Ver detalhes</span>
                </Button>
            </TableCell>

            {/* Hours */}
            <TableCell className="text-right font-mono border-l bg-blue-50/30 dark:bg-blue-900/5 align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDuration(row.segundos_ops)}</span>
                    <span className="text-[10px] text-slate-500">{calculatePercentage(row.segundos_ops, totalHours)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right font-mono border-r bg-blue-50/30 dark:bg-blue-900/5 align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{formatDuration(row.segundos_mkt)}</span>
                    <span className="text-[10px] text-purple-500/80 font-medium">{calculatePercentage(row.segundos_mkt, totalHours)}</span>
                </div>
            </TableCell>

            {/* Ofertadas */}
            <TableCell className="text-right border-l align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.ofertadas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-500">{calculatePercentage(row.ofertadas_ops, row.ofertadas_ops + row.ofertadas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{row.ofertadas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/80 font-medium">{calculatePercentage(row.ofertadas_mkt, row.ofertadas_ops + row.ofertadas_mkt)}</span>
                </div>
            </TableCell>

            {/* Aceitas */}
            <TableCell className="text-right border-l align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.aceitas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-500">{calculatePercentage(row.aceitas_ops, row.aceitas_ops + row.aceitas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{row.aceitas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/80 font-medium">{calculatePercentage(row.aceitas_mkt, row.aceitas_ops + row.aceitas_mkt)}</span>
                </div>
            </TableCell>

            {/* Completas */}
            <TableCell className="text-right border-l align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.concluidas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-500">{calculatePercentage(row.concluidas_ops, row.concluidas_ops + row.concluidas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{row.concluidas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/80 font-medium">{calculatePercentage(row.concluidas_mkt, row.concluidas_ops + row.concluidas_mkt)}</span>
                </div>
            </TableCell>

            {/* Rejeitadas */}
            <TableCell className="text-right border-l align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.rejeitadas_ops.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-500">{calculatePercentage(row.rejeitadas_ops, row.rejeitadas_ops + row.rejeitadas_mkt)}</span>
                </div>
            </TableCell>
            <TableCell className="text-right align-top py-2">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{row.rejeitadas_mkt.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-purple-500/80 font-medium">{calculatePercentage(row.rejeitadas_mkt, row.rejeitadas_ops + row.rejeitadas_mkt)}</span>
                </div>
            </TableCell>
        </TableRow>
    );
});
