import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterClearButtonProps {
  onClear: () => void;
  className?: string;
}

export const FilterClearButton: React.FC<FilterClearButtonProps> = ({ onClear, className }) => {
  return (
    <div className={cn("flex w-full flex-col gap-1 sm:w-auto", className)}>
      <span className="select-none pl-1 text-[11px] font-semibold text-transparent">
        Acao
      </span>
      <button
        onClick={onClear}
        type="button"
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200/80 bg-white px-4 text-xs font-semibold text-slate-500 shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 sm:w-auto",
          "hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md",
          "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/20 dark:hover:text-rose-400",
          "focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Limpar
      </button>
    </div>
  );
};

export default FilterClearButton;
