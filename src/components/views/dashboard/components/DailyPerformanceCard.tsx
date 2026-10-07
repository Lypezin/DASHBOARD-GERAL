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
    ? 'text-emerald-700 dark:text-emerald-300'
    : isMid
    ? 'text-[#236b91] dark:text-sky-300'
    : 'text-rose-700 dark:text-rose-300';

  const barColor = isHigh
    ? 'bg-emerald-500'
    : isMid
    ? 'bg-sky-600'
    : 'bg-rose-500';

  const statusLabel = isHigh ? 'Acima da meta' : isMid ? 'Em ajuste' : 'Abaixo da meta';

  const horasEntregues = formatarHorasParaHMS(dia.horas_entregues || '0');
  const horasMeta = formatarHorasParaHMS(dia.horas_a_entregar || '0');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <article
          className={cn(
            "group relative flex min-h-[194px] min-w-0 cursor-help select-none flex-col gap-3 p-3.5 transition-colors duration-150 hover:bg-[#f5f9fb] dark:hover:bg-slate-800/40",
            isToday ? "bg-[#f2f7fa] dark:bg-slate-800/50" : ""
          )}
          aria-label={`${dia.dia_da_semana || 'Dia'}, aderência ${aderencia.toFixed(1)}%`}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {dia.dia_da_semana?.substring(0, 3) || '---'}
              </h3>
              {isToday ? <span className="shrink-0 text-[10px] font-semibold text-[#236b91] dark:text-sky-300">Hoje</span> : null}
            </div>
            <span className={cn("shrink-0 text-[10px] font-medium", statusColor)}>{statusLabel}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className={cn("font-mono text-[22px] font-semibold leading-7 tracking-tight tabular-nums", statusColor)}>
                {aderencia.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Aderência</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={`Aderência de ${dia.dia_da_semana || 'dia'}`} aria-valuenow={Math.min(Math.max(aderencia, 0), 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className={cn("h-full rounded-full transition-[width] duration-200", barColor)} style={{ width: `${Math.min(Math.max(aderencia, 0), 100)}%` }} />
            </div>
          </div>

          <dl className="grid grid-cols-2 divide-x divide-[#e2ebf0] border-y border-[#e2ebf0] py-2 dark:divide-slate-800 dark:border-slate-800">
            <div className="min-w-0 pr-2">
              <dt className="text-[10px] text-slate-500 dark:text-slate-400">Realizadas</dt>
              <dd className="mt-0.5 truncate font-mono text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100" title={horasEntregues}>{horasEntregues}</dd>
            </div>
            <div className="min-w-0 pl-2">
              <dt className="text-[10px] text-slate-500 dark:text-slate-400">Meta</dt>
              <dd className="mt-0.5 truncate font-mono text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-300" title={`Meta: ${horasMeta}`}>{horasMeta}</dd>
            </div>
          </dl>

          <DailyCorridasMetrics ofertadas={dia.corridas_ofertadas} completadas={dia.corridas_completadas} />
        </article>
      </TooltipTrigger>
      <DailyPerformanceTooltip dia={dia} />
    </Tooltip>
  );
});

DailyPerformanceCard.displayName = 'DailyPerformanceCard';
export default DailyPerformanceCard;
