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
                      hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors
                      ${diaIdx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/30'}
                      ${metricIdx === 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
                    `}
                >
                    {/* Dia column — only on first metric row */}
                    {metricIdx === 0 ? (
                        <TableCell
                            rowSpan={COMPARACAO_METRICS.length}
                            className="font-semibold text-sm text-slate-800 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800 align-middle pl-5 w-[130px] py-3"
                        >
                            {dia}
                        </TableCell>
                    ) : null}

                    {/* Metric label */}
                    <TableCell className={`text-xs py-2.5 font-medium ${metric.color}`}>
                        {metric.label}
                    </TableCell>

                    {/* Week columns */}
                    {semanasSelecionadas.map((_, weekIdx) => {
                        const weeklyData = dadosComparacao[weekIdx];
                        const dayData = weeklyData?.aderencia_dia?.find(d => d.dia_semana === dia || d.dia === dia);

                        const rawValue = getRawValue(dayData, metric.key);
                        const displayValue = dayData ? formatValue(rawValue, metric) : '–';

                        const isAderencia = metric.key.includes('aderencia');
                        const percentValue = isAderencia ? Number(rawValue) : 0;
                        const barColor =
                            percentValue >= 90 ? 'bg-emerald-500' :
                                percentValue >= 80 ? 'bg-blue-500' :
                                    percentValue >= 70 ? 'bg-amber-500' :
                                        'bg-rose-500';

                        let variacao: number | null = null;
                        if (weekIdx > 0) {
                            const prevWeeklyData = dadosComparacao[weekIdx - 1];
                            const prevDayData = prevWeeklyData?.aderencia_dia?.find(d => d.dia_semana === dia || d.dia === dia);
                            const prevValue = getRawValue(prevDayData, metric.key);
                            variacao = calculateVariation(rawValue, prevValue, metric);
                        }

                        return (
                            <React.Fragment key={weekIdx}>
                                {/* Value cell */}
                                <TableCell className="text-center text-xs border-l border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-2.5 min-w-[100px]">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="font-medium tabular-nums">{displayValue}</span>
                                        {isAderencia && dayData && (
                                            <div className="w-14 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                    style={{ width: `${Math.min(percentValue, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Var cell — only for weeks after the first */}
                                {weekIdx > 0 && (
                                    <TableCell className="text-center p-1.5 w-[70px]">
                                        <VariacaoBadge variacao={variacao ?? 0} className="mx-auto scale-90" />
                                    </TableCell>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableRow>
            ))}
        </React.Fragment>
    );
});

ComparacaoDiaGroup.displayName = 'ComparacaoDiaGroup';
