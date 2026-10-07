import React from 'react';

interface DailyCorridasMetricsProps {
  ofertadas?: number;
  completadas?: number;
}

export const DailyCorridasMetrics: React.FC<DailyCorridasMetricsProps> = ({ ofertadas, completadas }) => {
  return (
    <dl className="grid w-full select-none grid-cols-2 gap-2">
      <div className="min-w-0">
        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Ofertadas</dt>
        <dd className="mt-0.5 whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {ofertadas?.toLocaleString('pt-BR') ?? 0}
        </dd>
      </div>
      <div className="min-w-0 text-right">
        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Completadas</dt>
        <dd className="mt-0.5 whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
          {completadas?.toLocaleString('pt-BR') ?? 0}
        </dd>
      </div>
    </dl>
  );
};

export default DailyCorridasMetrics;
