import React from 'react';

interface DailyCorridasMetricsProps {
  ofertadas?: number;
  completadas?: number;
}

export const DailyCorridasMetrics: React.FC<DailyCorridasMetricsProps> = ({ ofertadas, completadas }) => {
  return (
    <div className="mt-3 grid w-full select-none grid-cols-2 gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
      <div className="flex min-w-0 flex-col">
        <span className="block w-full truncate text-[10px] font-medium text-slate-400">
          Ofertadas
        </span>
        <span className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
          {ofertadas?.toLocaleString('pt-BR') || 0}
        </span>
      </div>
      <div className="flex min-w-0 flex-col text-right">
        <span className="block w-full truncate text-[10px] font-medium text-slate-400">
          Completas
        </span>
        <span className="mt-0.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {completadas?.toLocaleString('pt-BR') || 0}
        </span>
      </div>
    </div>
  );
};

export default DailyCorridasMetrics;
