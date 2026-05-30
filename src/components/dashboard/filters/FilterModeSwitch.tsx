import React from 'react';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterModeSwitchProps {
  isModoIntervalo: boolean;
  onToggle: () => void;
  className?: string;
}

export const FilterModeSwitch: React.FC<FilterModeSwitchProps> = ({ isModoIntervalo, onToggle, className }) => {
  return (
    <div className={cn("flex w-full flex-col gap-1 sm:w-auto", className)}>
      <span className="select-none pl-1 text-[11px] font-semibold text-slate-400">
        Periodo
      </span>
      <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 text-xs shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 sm:w-auto">
        <CalendarRange className="h-4 w-4 text-blue-500" />
        <span className={cn(
          "whitespace-nowrap font-semibold transition-colors duration-200",
          !isModoIntervalo ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
        )}>
          Ano/Semana
        </span>

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            isModoIntervalo ? "bg-blue-600" : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          )}
          role="switch"
          aria-checked={isModoIntervalo}
        >
          <span className="sr-only">Alternar modo de filtro</span>
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
              isModoIntervalo ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>

        <span className={cn(
          "whitespace-nowrap font-semibold transition-colors duration-200",
          isModoIntervalo ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
        )}>
          Intervalo
        </span>
      </div>
    </div>
  );
};

export default FilterModeSwitch;
