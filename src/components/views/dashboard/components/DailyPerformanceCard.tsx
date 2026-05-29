import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AderenciaDia } from '@/types';
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { DailyPerformanceTooltip } from './DailyPerformanceTooltip';
import { DailyCorridasMetrics } from './DailyCorridasMetrics';
import { cn } from '@/lib/utils';

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
        aderencia >= 70 ? 'text-primary dark:text-blue-400' :
            'text-rose-600 dark:text-rose-400';

    const barColor = aderencia >= 90 ? 'bg-emerald-500' :
        aderencia >= 70 ? 'bg-primary' :
            'bg-rose-500';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div key={`dia-${index}`}>
                    <Card
                        className={cn(
                            "cursor-help border border-border shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200",
                            isToday
                                ? "bg-primary/[0.03] ring-1 ring-primary/20 dark:bg-primary/[0.02] dark:ring-primary/10"
                                : "bg-card",
                            "hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                        )}
                    >
                        <CardContent className="flex h-full min-h-[140px] flex-col items-center justify-between p-4">
                            {/* Dia da semana */}
                            <div className="text-center w-full">
                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        isToday 
                                          ? "bg-primary/10 text-primary" 
                                          : "bg-muted text-muted-foreground/80"
                                    )}>
                                        {dia.dia_da_semana?.substring(0, 3) || '---'}
                                    </div>
                                </div>

                                {/* Valor numérico destacado */}
                                <div className={`font-mono text-xl font-black tracking-tight sm:text-2xl ${statusColor}`}>
                                    {aderencia.toFixed(1)}%
                                </div>
                            </div>

                            {/* Barra de progresso ultra fina e metas */}
                            <div className="w-full space-y-3 mt-3">
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${barColor} rounded-full transition-all duration-700`}
                                        style={{ width: `${Math.min(aderencia, 100)}%` }}
                                    ></div>
                                </div>

                                <div className="flex flex-col items-center justify-center w-full text-center">
                                    <span className="rounded bg-muted/60 px-2 py-0.5 font-mono text-[10px] sm:text-xs font-bold tracking-tight text-foreground/80">
                                        {formatarHorasParaHMS(dia.horas_entregues || '0')}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono mt-1 opacity-70">
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

DailyPerformanceCard.displayName = 'DailyPerformanceCard';
