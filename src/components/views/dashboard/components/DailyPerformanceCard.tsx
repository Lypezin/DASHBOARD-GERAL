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

  const isHigh = aderencia >= 90;
  const isMid = aderencia >= 70;

  const statusColor = isHigh
    ? 'text-emerald-600 dark:text-emerald-400'
    : isMid
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-rose-600 dark:text-rose-400';

  const barColor = isHigh
    ? 'bg-emerald-500'
    : isMid
    ? 'bg-blue-500'
    : 'bg-rose-500';

  const borderStatusClass = isHigh
    ? 'border-emerald-200/70 hover:border-emerald-300/80'
    : isMid
    ? 'border-blue-200/70 hover:border-blue-300/80'
    : 'border-rose-200/70 hover:border-rose-300/80';

  const horasEntregues = formatarHorasParaHMS(dia.horas_entregues || '0');
  const horasMeta = formatarHorasParaHMS(dia.horas_a_entregar || '0');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div key={`dia-${index}`} className="h-full min-w-0 select-none">
          <Card
            className={cn(
              "h-full cursor-help rounded-xl border bg-white/95 shadow-sm animate-fade-in transition-[border-color,box-shadow,transform] duration-200 dark:bg-slate-900/90",
              isToday ? "ring-1 ring-blue-300/70 dark:ring-blue-900/60" : "",
              borderStatusClass,
              "hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80"
            )}
            style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
          >
            <CardContent className="flex h-full min-h-[172px] flex-col justify-between p-4">
              <div className="flex w-full items-center justify-between gap-2">
                <div
                  className={cn(
                    "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold",
                    isToday
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {dia.dia_da_semana?.substring(0, 3) || '---'}
                </div>

                <div className={cn("font-mono text-base font-semibold", statusColor)}>
                  {aderencia.toFixed(1)}%
                </div>
              </div>

              <div className="my-3 w-full space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", barColor)}
                    style={{ width: `${Math.min(aderencia, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pl-0.5 text-[11px] font-medium text-slate-400">
                  <span>Progresso</span>
                  <span className={statusColor}>{Math.min(aderencia, 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="flex w-full flex-col text-left">
                <span
                  className="block w-full truncate rounded-md border border-slate-200/70 bg-slate-50 px-2.5 py-1.5 text-center font-mono text-xs font-semibold text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
                  title={horasEntregues}
                >
                  {horasEntregues}
                </span>
                <span
                  className="mt-1 block truncate text-center font-mono text-[11px] font-medium text-slate-400"
                  title={`Meta: ${horasMeta}`}
                >
                  Meta: {horasMeta}
                </span>
              </div>

              <DailyCorridasMetrics
                ofertadas={dia.corridas_ofertadas}
                completadas={dia.corridas_completadas}
              />
            </CardContent>
          </Card>
        </div>
      </TooltipTrigger>
      <DailyPerformanceTooltip dia={dia} />
    </Tooltip>
  );
});

DailyPerformanceCard.displayName = 'DailyPerformanceCard';
export default DailyPerformanceCard;
