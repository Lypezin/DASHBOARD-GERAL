import React from 'react';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterModeSwitchProps {
  isModoIntervalo: boolean;
  onToggle: () => void;
  className?: string;
  appearance?: 'default' | 'quiet';
}

export const FilterModeSwitch: React.FC<FilterModeSwitchProps> = ({ isModoIntervalo, onToggle, className, appearance = 'default' }) => {
  return (
    <div className={cn("flex w-full flex-col gap-1 sm:w-auto", className)} data-filter-role="period">
      <span className={cn(
        "select-none pl-1 text-[11px] font-semibold text-slate-400",
        appearance === 'quiet' && "pl-0 text-slate-600 dark:text-slate-300"
      )}>
        Periodo
      </span>
      <div className={cn(
        "flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 text-xs shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 sm:w-auto",
        appearance === 'quiet' && "rounded-none border-0 bg-transparent px-0 shadow-none hover:border-transparent dark:bg-transparent"
      )} data-filter-role="period-control">
        <CalendarRange className={cn("h-4 w-4 text-blue-500", appearance === 'quiet' && "text-[#347ca3] dark:text-sky-200")} />
        <span className={cn(
          "whitespace-nowrap font-semibold transition-colors duration-200",
          !isModoIntervalo
            ? appearance === 'quiet' ? "text-[#155d8b] dark:text-sky-200" : "text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400"
        )}>
          Ano/Semana
        </span>

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            isModoIntervalo
              ? appearance === 'quiet' ? "bg-[#17638d] dark:bg-sky-500" : "bg-blue-600"
              : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
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
          isModoIntervalo
            ? appearance === 'quiet' ? "text-[#155d8b] dark:text-sky-200" : "text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400"
        )}>
          Intervalo
        </span>
      </div>
    </div>
  );
};

export default FilterModeSwitch;
