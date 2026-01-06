import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { DashboardResumoData } from '@/types';
import {
    COMPARACAO_METRICS,
    getRawValue,
    formatValue,
    calculateVariation
} from '../utils/comparacaoHelpers';

interface ComparacaoDiaGroupProps {
    dia: string;
    diaIdx: number;
    semanasSelecionadas: (number | string)[];
    dadosComparacao: DashboardResumoData[];
}

export const ComparacaoDiaGroup = React.memo<ComparacaoDiaGroupProps>(({
    dia,
    diaIdx,
    semanasSelecionadas,
    dadosComparacao
}) => {
    return (
        <React.Fragment key={dia}>
            {COMPARACAO_METRICS.map((metric, metricIdx) => (
                <TableRow
                    key={`${dia}-${metric.key}`}
                    className={`
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                      ${diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}
                      ${metricIdx === 0 ? 'border-t-2 border-slate-100 dark:border-slate-800' : ''}
                    `}
                >
                    {metricIdx === 0 && (
                        <TableCell
                            rowSpan={COMPARACAO_METRICS.length}
                            className="font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 align-top bg-slate-50/50 dark:bg-slate-800/20 w-[140px]"
                        >
                            {dia}
                        </TableCell>
                    )}
                    <TableCell className={`font-medium text-xs ${metric.color}`}>
                        {metric.label}
                    </TableCell>
                    {semanasSelecionadas.map((_, weekIdx) => {
                        const weeklyData = dadosComparacao[weekIdx];
                        const dayData = weeklyData?.aderencia_dia?.find(d => d.dia_semana === dia);

                        // Calculate current value
                        const rawValue = getRawValue(dayData, metric.key);
                        const displayValue = dayData ? formatValue(rawValue, metric) : '-';

                        // Calculate Variation
                        let variacao: number | null = null;
                        if (weekIdx > 0) {
                            const prevWeeklyData = dadosComparacao[weekIdx - 1];
                            const prevDayData = prevWeeklyData?.aderencia_dia?.find(d => d.dia_semana === dia);
                            const prevValue = getRawValue(prevDayData, metric.key);

                            variacao = calculateVariation(rawValue, prevValue, metric);
                        }

                        return (
                            <React.Fragment key={weekIdx}>
                                <TableCell className="text-center text-xs border-l border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                    {displayValue}
                                </TableCell>
                                <TableCell className="text-center p-1">
                                    {weekIdx > 0 ? (
                                        <VariacaoBadge variacao={variacao ?? 0} className="mx-auto" />
                                    ) : (
                                        <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                                    )}
                                </TableCell>
                            </React.Fragment>
                        );
                    })}
                </TableRow>
            ))}
        </React.Fragment>
    );
});

ComparacaoDiaGroup.displayName = 'ComparacaoDiaGroup';
