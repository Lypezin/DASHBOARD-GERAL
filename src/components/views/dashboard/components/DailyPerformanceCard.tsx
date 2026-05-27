
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AderenciaDia } from '@/types';
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { DailyPerformanceTooltip } from './DailyPerformanceTooltip';

import { DailyCorridasMetrics } from './DailyCorridasMetrics';

interface DailyPerformanceCardProps {
    dia: AderenciaDia;
    index: number;
}

export const DailyPerformanceCard = React.memo(function DailyPerformanceCard({
    dia,
    index
}: DailyPerformanceCardProps) {
    const aderencia = dia.aderencia_percentual || 0;
    const isToday = new Date().getDay() === (index + 1) % 7;

    const statusColor = aderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
        aderencia >= 70 ? 'text-blue-600 dark:text-blue-400' :
            'text-rose-600 dark:text-rose-400';

    const barColor = aderencia >= 90 ? 'bg-emerald-500' :
        aderencia >= 70 ? 'bg-blue-500' :
            'bg-rose-500';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div key={`dia-${index}`}>
                    <Card
                        className={`cursor-help border border-slate-200/60 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 dark:border-slate-800/70 ${isToday
                            ? 'bg-blue-50/70 ring-1 ring-blue-200 dark:bg-blue-900/10 dark:ring-blue-800'
                            : 'bg-white/75 supports-[backdrop-filter]:backdrop-blur-sm dark:bg-slate-900/75'
                            } hover:border-slate-300/80 hover:shadow-md dark:hover:border-slate-700`}
                    >
                        <CardContent className="flex h-full min-h-[140px] flex-col items-center justify-between p-4">
                            <div className="text-center w-full">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <div className={`p-1.5 rounded-lg ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {dia.dia_da_semana?.substring(0, 3) || '---'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`font-mono text-xl font-black tracking-tight sm:text-2xl ${statusColor}`}>
                                    {aderencia.toFixed(2)}%
                                </div>
                            </div>

                            <div className="w-full space-y-2 mt-3">
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${barColor} rounded-full transition-[width] duration-700`}
                                        style={{ width: `${Math.min(aderencia, 100)}%` }}
                                    ></div>
                                </div>

                                <div className="flex flex-col items-center justify-center mt-2 w-full text-center">
                                    <span className="rounded bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold leading-none tracking-tight text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 text-nowrap">
                                        {formatarHorasParaHMS(dia.horas_entregues || '0')}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 opacity-80 text-nowrap">
                                        Meta: {formatarHorasParaHMS(dia.horas_a_entregar || '0')}
                                    </span>

                                    <DailyCorridasMetrics
                                        ofertadas={dia.corridas_ofertadas}
                                        completadas={dia.corridas_completadas}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TooltipTrigger>
            <DailyPerformanceTooltip dia={dia} />
        </Tooltip>
    );
});
