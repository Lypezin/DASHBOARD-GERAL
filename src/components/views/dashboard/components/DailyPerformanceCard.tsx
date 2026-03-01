
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, Variants } from 'framer-motion';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AderenciaDia } from '@/types';
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DailyPerformanceTooltip } from './DailyPerformanceTooltip';

import { DailyCorridasMetrics } from './DailyCorridasMetrics';

interface DailyPerformanceCardProps {
    dia: AderenciaDia;
    index: number;
    variants: Variants;
}

export const DailyPerformanceCard = React.memo(function DailyPerformanceCard({
    dia,
    index,
    variants
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
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div key={`dia-${index}`} variants={variants}>
                        <Card
                            className={`border-none shadow-md hover:shadow-lg transition-all duration-300 ${isToday
                                ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-200 dark:ring-blue-800'
                                : 'bg-white dark:bg-slate-900'
                                } cursor-help`}
                        >
                            <CardContent className="p-4 flex flex-col items-center justify-between h-full min-h-[140px]">
                                <div className="text-center w-full">
                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                        <div className={`p-1.5 rounded-lg ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {dia.dia_da_semana?.substring(0, 3) || '---'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`text-2xl font-bold font-mono tracking-tight ${statusColor}`}>
                                        {aderencia.toFixed(2)}%
                                    </div>
                                </div>

                                <div className="w-full space-y-2 mt-3">
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                                            style={{ width: `${Math.min(aderencia, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center mt-2 w-full text-center">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono tracking-tight leading-none bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-nowrap">
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
                    </motion.div>
                </TooltipTrigger>
                <DailyPerformanceTooltip dia={dia} />
            </Tooltip>
        </TooltipProvider>
    );
});
