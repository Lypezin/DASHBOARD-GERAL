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
                      hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200
                      ${diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}
                      ${metricIdx === 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
                    `}
                >
                    {metricIdx === 0 && (
                        <TableCell
                            rowSpan={COMPARACAO_METRICS.length}
                            className="font-bold text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 align-top bg-slate-50/50 dark:bg-slate-800/20 w-[140px] py-4"
                        >
                            <span className="sticky top-0 capitalize">{dia}</span>
                        </TableCell>
                    )}
                    <TableCell className={`font-medium text-xs py-3 ${metric.color}`}>
                        {metric.label}
                    </TableCell>
                    {semanasSelecionadas.map((_, weekIdx) => {
                        const weeklyData = dadosComparacao[weekIdx];
                        const dayData = weeklyData?.aderencia_dia?.find(d => d.dia_semana === dia || d.dia === dia);

                        // Calculate current value
                        const rawValue = getRawValue(dayData, metric.key);
                        const displayValue = dayData ? formatValue(rawValue, metric) : '-';

                        // Visual Indicator Logic for Aderencia
                        const isAderencia = metric.key.includes('aderencia');
                        const percentValue = isAderencia ? Number(rawValue) : 0;
                        const barColor = percentValue >= 90 ? 'bg-emerald-500' : percentValue >= 80 ? 'bg-blue-500' : percentValue >= 70 ? 'bg-amber-500' : 'bg-rose-500';

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
                                <TableCell className="text-center text-xs border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-2 relative group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center gap-1.5 min-h-[2rem]">
                                        <span className="z-10 relative font-medium">{displayValue}</span>
                                        {isAderencia && dayData && (
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[60px]">
                                                <div
                                                    className={`h-full ${barColor} transition-all duration-500`}
                                                    style={{ width: `${Math.min(percentValue, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center p-1 w-[60px]">
                                    {weekIdx > 0 ? (
                                        <VariacaoBadge variacao={variacao ?? 0} className="mx-auto scale-90" />
                                    ) : (
                                        <span className="text-slate-200 dark:text-slate-700 text-[10px]">•</span>
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
