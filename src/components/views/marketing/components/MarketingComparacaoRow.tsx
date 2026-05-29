import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ComparisonMetricCell } from './ComparisonMetricCell';
import { extractWeekNumber } from '@/utils/timeHelpers';

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
    return (
        <TableRow className="group border-b border-slate-50 transition-all duration-200 hover:bg-slate-50/80 dark:border-slate-800/50 dark:hover:bg-slate-800/50">
            <TableCell className="whitespace-nowrap py-4 pl-6 font-medium">
                <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        S{extractWeekNumber(row.semana_iso)}
                    </span>
                </div>
            </TableCell>
            <TableCell className="py-4 text-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-500 opacity-0 transition-all hover:bg-blue-50 group-hover:opacity-100 dark:hover:bg-blue-900/20"
                    onClick={() => onSelectWeek(row.semana_iso)}
                    title="Ver detalhes"
                >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
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
