
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
            <TableCell className="text-right font-mono border-l bg-blue-50/30 dark:bg-blue-900/5">{formatDuration(row.segundos_ops)}</TableCell>
            <TableCell className="text-right font-mono font-bold text-purple-600 dark:text-purple-400 bg-blue-50/30 dark:bg-blue-900/5">{formatDuration(row.segundos_mkt)}</TableCell>
            <TableCell className="text-right text-xs text-slate-500 bg-blue-50/30 dark:bg-blue-900/5">{calculatePercentage(row.segundos_ops, totalHours)}</TableCell>
            <TableCell className="text-right text-xs text-purple-500 font-semibold bg-blue-50/30 dark:bg-blue-900/5">{calculatePercentage(row.segundos_mkt, totalHours)}</TableCell>

            {/* Ofertadas */}
            <TableCell className="text-right border-l">{row.ofertadas_ops.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.ofertadas_mkt.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right text-xs text-slate-500">{calculatePercentage(row.ofertadas_ops, row.ofertadas_ops + row.ofertadas_mkt)}</TableCell>
            <TableCell className="text-right text-xs text-purple-500 font-semibold">{calculatePercentage(row.ofertadas_mkt, row.ofertadas_ops + row.ofertadas_mkt)}</TableCell>

            {/* Aceitas */}
            <TableCell className="text-right border-l">{row.aceitas_ops.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.aceitas_mkt.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right text-xs text-slate-500">{calculatePercentage(row.aceitas_ops, row.aceitas_ops + row.aceitas_mkt)}</TableCell>
            <TableCell className="text-right text-xs text-purple-500 font-semibold">{calculatePercentage(row.aceitas_mkt, row.aceitas_ops + row.aceitas_mkt)}</TableCell>

            {/* Completas */}
            <TableCell className="text-right border-l">{row.concluidas_ops.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.concluidas_mkt.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right text-xs text-slate-500">{calculatePercentage(row.concluidas_ops, row.concluidas_ops + row.concluidas_mkt)}</TableCell>
            <TableCell className="text-right text-xs text-purple-500 font-semibold">{calculatePercentage(row.concluidas_mkt, row.concluidas_ops + row.concluidas_mkt)}</TableCell>

            {/* Rejeitadas */}
            <TableCell className="text-right border-l">{row.rejeitadas_ops.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.rejeitadas_mkt.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right text-xs text-slate-500">{calculatePercentage(row.rejeitadas_ops, row.rejeitadas_ops + row.rejeitadas_mkt)}</TableCell>
            <TableCell className="text-right text-xs text-purple-500 font-semibold">{calculatePercentage(row.rejeitadas_mkt, row.rejeitadas_ops + row.rejeitadas_mkt)}</TableCell>
        </TableRow>
    );
});
