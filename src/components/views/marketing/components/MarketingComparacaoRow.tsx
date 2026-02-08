
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ComparisonMetricCell } from './ComparisonMetricCell';
import { extractWeekNumber } from '@/utils/timeHelpers';

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
            <ComparisonMetricCell
                opsValue={row.entregadores_ops || 0}
                mktValue={row.entregadores_mkt || 0}
                opsColorClass="text-indigo-600 dark:text-indigo-400"
            />

            {/* Hours */}
            <ComparisonMetricCell
                opsValue={row.segundos_ops}
                mktValue={row.segundos_mkt}
                type="duration"
            />

            {/* Ofertadas */}
            <ComparisonMetricCell
                opsValue={row.ofertadas_ops}
                mktValue={row.ofertadas_mkt}
            />

            {/* Aceitas */}
            <ComparisonMetricCell
                opsValue={row.aceitas_ops}
                mktValue={row.aceitas_mkt}
            />

            {/* Completas */}
            <ComparisonMetricCell
                opsValue={row.concluidas_ops}
                mktValue={row.concluidas_mkt}
            />

            {/* Rejeitadas */}
            <ComparisonMetricCell
                opsValue={row.rejeitadas_ops}
                mktValue={row.rejeitadas_mkt}
                opsColorClass="text-rose-600/70 dark:text-rose-400/70"
            />

            {/* Valor */}
            <ComparisonMetricCell
                opsValue={row.valor_ops || 0}
                mktValue={row.valor_mkt || 0}
                type="currency"
            />
        </TableRow>
    );
});
