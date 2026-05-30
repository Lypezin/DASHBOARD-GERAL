import React from 'react';

interface DailyCorridasMetricsProps {
  ofertadas?: number;
  completadas?: number;
}

export const DailyCorridasMetrics: React.FC<DailyCorridasMetricsProps> = ({ ofertadas, completadas }) => {
  return (
    <div className="grid w-full select-none grid-cols-2 gap-2">
      <div className="min-w-0 rounded-xl bg-slate-50/80 px-2 py-2 ring-1 ring-slate-200/70 dark:bg-slate-900/50 dark:ring-slate-800/80">
        <span className="block w-full text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          Ofert.
        </span>
        <span className="mt-1 block whitespace-nowrap font-mono text-xs font-semibold text-slate-950 tabular-nums dark:text-slate-100">
          {ofertadas?.toLocaleString('pt-BR') || 0}
        </span>
      </div>
      <div className="min-w-0 rounded-xl bg-emerald-50/80 px-2 py-2 text-right ring-1 ring-emerald-200/70 dark:bg-emerald-950/20 dark:ring-emerald-900/50">
        <span className="block w-full text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-500 dark:text-emerald-400">
          Comp.
        </span>
        <span className="mt-1 block whitespace-nowrap font-mono text-xs font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
          {completadas?.toLocaleString('pt-BR') || 0}
        </span>
      </div>
    </div>
  );
};

export default DailyCorridasMetrics;
