import React from 'react';
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

  const softStatusClass = isHigh
    ? 'bg-emerald-50/80 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-950/25 dark:text-emerald-300 dark:ring-emerald-900/50'
    : isMid
    ? 'bg-blue-50/80 text-blue-700 ring-blue-200/80 dark:bg-blue-950/25 dark:text-blue-300 dark:ring-blue-900/50'
    : 'bg-rose-50/80 text-rose-700 ring-rose-200/80 dark:bg-rose-950/25 dark:text-rose-300 dark:ring-rose-900/50';

  const statusLabel = isHigh ? 'Meta forte' : isMid ? 'Em ajuste' : 'Abaixo';

  const horasEntregues = formatarHorasParaHMS(dia.horas_entregues || '0');
  const horasMeta = formatarHorasParaHMS(dia.horas_a_entregar || '0');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          key={`dia-${index}`}
          className={cn(
            "group relative flex min-h-[208px] min-w-0 cursor-help select-none flex-col justify-between overflow-hidden border-r border-slate-200/70 bg-white/80 p-3.5 transition-[background-color,box-shadow,transform] duration-300 last:border-r-0 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_48px_-34px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-950/30 dark:hover:bg-slate-900/70",
            isToday ? "bg-blue-50/80 ring-1 ring-inset ring-blue-200/80 dark:bg-blue-950/20 dark:ring-blue-900/50" : ""
          )}
          style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
        >
          <div className={cn("absolute inset-x-4 top-0 h-1 rounded-b-full", barColor)} />

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 pt-1">
              <div className="min-w-0">
                <div
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    isToday
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 dark:bg-blue-400 dark:text-slate-950"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {dia.dia_da_semana?.substring(0, 3) || '---'}
                </div>
                {isToday && (
                  <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                    Hoje
                  </span>
                )}
              </div>

              <div className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1", softStatusClass)}>
                {statusLabel}
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between gap-2">
                <div className={cn("font-mono text-[1.55rem] font-semibold leading-none tracking-tight tabular-nums", statusColor)}>
                  {aderencia.toFixed(1)}%
                </div>
                <span className="pb-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Aderência
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700/70">
                <div
                  className={cn("h-full rounded-full transition-all duration-300 ease-out", barColor)}
                  style={{ width: `${Math.min(aderencia, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-2.5 shadow-sm transition-colors duration-300 group-hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:group-hover:bg-slate-900/80">
              <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Horas realizadas
              </div>
              <span
                className="block whitespace-nowrap font-mono text-[13px] font-semibold text-slate-950 tabular-nums dark:text-slate-50"
                title={horasEntregues}
              >
                {horasEntregues}
              </span>
              <span
                className="mt-1 block whitespace-nowrap font-mono text-[10px] font-medium text-slate-400 tabular-nums"
                title={`Meta: ${horasMeta}`}
              >
                Meta {horasMeta}
              </span>
            </div>

            <DailyCorridasMetrics
              ofertadas={dia.corridas_ofertadas}
              completadas={dia.corridas_completadas}
            />
          </div>
        </div>
      </TooltipTrigger>
      <DailyPerformanceTooltip dia={dia} />
    </Tooltip>
  );
});

DailyPerformanceCard.displayName = 'DailyPerformanceCard';
export default DailyPerformanceCard;
