import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ComparisonMetricCell } from './ComparisonMetricCell';
import { extractWeekNumber } from '@/utils/formatters/dateUtils';

interface ComparacaoRow {
    semana_iso: string; segundos_ops: number; segundos_mkt: number;
    ofertadas_ops: number; ofertadas_mkt: number; aceitas_ops: number; aceitas_mkt: number;
    concluidas_ops: number; concluidas_mkt: number; rejeitadas_ops: number; rejeitadas_mkt: number;
    valor_ops?: number; valor_mkt?: number; entregadores_ops?: number; entregadores_mkt?: number;
}

interface MarketingComparacaoRowProps {
    row: ComparacaoRow;
    onSelectWeek: (semana_iso: string) => void;
}

export const MarketingComparacaoRow = React.memo(function MarketingComparacaoRow({
    row,
    onSelectWeek,
}: MarketingComparacaoRowProps) {
    const weekNumber = extractWeekNumber(row.semana_iso);
    const [weekYear = ''] = row.semana_iso.split('-W');
    const weekLabel = weekYear && weekNumber
        ? `Semana ${weekNumber} de ${weekYear}`
        : `Semana ${weekNumber}`;

    return (
        <TableRow className="border-b border-slate-100 transition-colors duration-150 hover:bg-[#f8fbfc] dark:border-slate-800 dark:hover:bg-slate-900/60">
            <TableCell className="whitespace-nowrap py-3 pl-4 font-medium">
                <div className="flex min-w-[72px] flex-col items-start">
                    <span aria-label={weekLabel} className="text-sm font-semibold text-[#183f58] dark:text-slate-100">
                        S{weekNumber}
                    </span>
                    {weekYear ? <span className="text-[11px] text-slate-500 dark:text-slate-400">{weekYear}</span> : null}
                </div>
            </TableCell>
            <TableCell className="py-2 text-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[#38708e] transition-colors duration-150 hover:bg-[#eef4f7] hover:text-[#174d70] focus-visible:ring-2 focus-visible:ring-[#38708e] dark:text-sky-300 dark:hover:bg-slate-800 dark:hover:text-sky-200"
                    onClick={() => onSelectWeek(row.semana_iso)}
                    aria-label={`Ver detalhes de ${weekLabel}`}
                    title={`Ver detalhes de ${weekLabel}`}
                >
                    <Search className="h-4 w-4" aria-hidden="true" />
                </Button>
            </TableCell>

            <ComparisonMetricCell
                opsValue={row.entregadores_ops || 0}
                mktValue={row.entregadores_mkt || 0}
                opsColorClass="text-sky-600 dark:text-sky-400"
            />

            <ComparisonMetricCell opsValue={row.segundos_ops} mktValue={row.segundos_mkt} type="duration" />
            <ComparisonMetricCell opsValue={row.ofertadas_ops} mktValue={row.ofertadas_mkt} />
            <ComparisonMetricCell opsValue={row.aceitas_ops} mktValue={row.aceitas_mkt} />
            <ComparisonMetricCell opsValue={row.concluidas_ops} mktValue={row.concluidas_mkt} />
            <ComparisonMetricCell
                opsValue={row.rejeitadas_ops}
                mktValue={row.rejeitadas_mkt}
                opsColorClass="text-rose-600/70 dark:text-rose-400/70"
            />
            <ComparisonMetricCell
                opsValue={row.valor_ops || 0}
                mktValue={row.valor_mkt || 0}
                type="currency"
            />
        </TableRow>
    );
});
