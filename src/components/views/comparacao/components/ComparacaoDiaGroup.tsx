import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { DashboardResumoData } from '@/types';

interface ComparacaoDiaGroupProps {
    dia: string;
    diaIdx: number;
    semanasSelecionadas: (number | string)[];
    dadosComparacao: DashboardResumoData[];
}

export const ComparacaoDiaGroup: React.FC<ComparacaoDiaGroupProps> = ({
    dia,
    diaIdx,
    semanasSelecionadas,
    dadosComparacao
}) => {
    const metrics = [
        { label: 'Corridas Ofertadas', key: 'corridas_ofertadas', color: 'text-slate-600 dark:text-slate-400' },
        { label: 'Corridas Aceitas', key: 'corridas_aceitas', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Corridas Rejeitadas', key: 'corridas_rejeitadas', color: 'text-rose-600 dark:text-rose-400' },
        { label: 'Corridas Completadas', key: 'corridas_completadas', color: 'text-purple-600 dark:text-purple-400' },
        { label: 'Taxa de Aceitação', key: 'taxa_aceitacao', color: 'text-blue-600 dark:text-blue-400', isPercent: true },
        { label: 'Horas Planejadas', key: 'horas_a_entregar', color: 'text-amber-600 dark:text-amber-400', isTime: true },
        { label: 'Horas Entregues', key: 'horas_entregues', color: 'text-teal-600 dark:text-teal-400', isTime: true },
        { label: 'Aderência', key: 'aderencia_percentual', color: 'text-slate-900 dark:text-white font-bold', isPercent: true }
    ];

    return (
        <React.Fragment key={dia}>
            {metrics.map((metric, metricIdx) => (
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
                            rowSpan={metrics.length}
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
                        const dayData = weeklyData.aderencia_dia.find(d => d.dia_semana === dia);

                        let rawValue: number | string = 0;
                        if (dayData) {
                            if (metric.key === 'taxa_aceitacao') {
                                rawValue = dayData.taxa_aceitacao ??
                                    (dayData.corridas_ofertadas ? (dayData.corridas_aceitas || 0) / dayData.corridas_ofertadas * 100 : 0);
                            } else if (metric.key === 'horas_a_entregar') {
                                // Prioritize seconds if available, otherwise parse string
                                if (dayData.segundos_planejados !== undefined && dayData.segundos_planejados !== null) {
                                    rawValue = dayData.segundos_planejados;
                                } else {
                                    rawValue = dayData.horas_a_entregar || 0;
                                }
                            } else if (metric.key === 'horas_entregues') {
                                // Prioritize seconds if available
                                if (dayData.segundos_realizados !== undefined && dayData.segundos_realizados !== null) {
                                    rawValue = dayData.segundos_realizados;
                                } else {
                                    rawValue = dayData.horas_entregues || 0;
                                }
                            } else {
                                // @ts-ignore - dynamic key access
                                rawValue = dayData[metric.key] ?? 0;
                            }
                        }

                        // Format value
                        let displayValue = '-';
                        if (dayData) {
                            if (metric.isTime) {
                                // If it's a number (seconds), format it. If it's a string, use it (or parse if it's "00:00:00" and we have seconds)
                                if (typeof rawValue === 'number') {
                                    const h = Math.floor(rawValue / 3600);
                                    const m = Math.floor((rawValue % 3600) / 60);
                                    const s = Math.floor(rawValue % 60);
                                    displayValue = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                                } else {
                                    displayValue = String(rawValue);
                                }
                            } else if (metric.isPercent) {
                                displayValue = `${Number(rawValue).toFixed(1)}%`;
                            } else {
                                displayValue = Number(rawValue).toLocaleString('pt-BR');
                            }
                        }

                        // Calculate Variation
                        let variacao: number | null = null;
                        if (weekIdx > 0) {
                            const prevWeeklyData = dadosComparacao[weekIdx - 1];
                            const prevDayData = prevWeeklyData.aderencia_dia.find(d => d.dia_semana === dia);
                            let prevValue: number = 0;

                            if (prevDayData) {
                                if (metric.key === 'taxa_aceitacao') {
                                    prevValue = prevDayData.taxa_aceitacao ??
                                        (prevDayData.corridas_ofertadas ? (prevDayData.corridas_aceitas || 0) / prevDayData.corridas_ofertadas * 100 : 0);
                                } else if (metric.isTime) {
                                    if (metric.key === 'horas_a_entregar' && prevDayData.segundos_planejados !== undefined) {
                                        prevValue = prevDayData.segundos_planejados;
                                    } else if (metric.key === 'horas_entregues' && prevDayData.segundos_realizados !== undefined) {
                                        prevValue = prevDayData.segundos_realizados;
                                    } else {
                                        // Fallback to parsing string
                                        const timeStr = prevDayData[metric.key as keyof typeof prevDayData] as string || '00:00:00';
                                        const [h, m, s] = timeStr.split(':').map(Number);
                                        prevValue = (h * 3600) + (m * 60) + (s || 0);
                                    }
                                } else {
                                    // @ts-ignore
                                    prevValue = Number(prevDayData[metric.key] ?? 0);
                                }
                            }

                            let currentValueNum = 0;
                            if (metric.isTime) {
                                if (typeof rawValue === 'number') {
                                    currentValueNum = rawValue;
                                } else {
                                    const [h, m, s] = String(rawValue).split(':').map(Number);
                                    currentValueNum = (h * 3600) + (m * 60) + (s || 0);
                                }
                            } else {
                                currentValueNum = Number(rawValue);
                            }

                            if (prevValue > 0) {
                                variacao = ((currentValueNum - prevValue) / prevValue) * 100;
                            } else if (currentValueNum > 0) {
                                variacao = 100;
                            } else {
                                variacao = 0;
                            }
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
};
