import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterClearButtonProps {
  onClear: () => void;
  className?: string;
}

export const FilterClearButton: React.FC<FilterClearButtonProps> = ({ onClear, className }) => {
  return (
    <div className={cn("flex flex-col gap-1 w-full sm:w-auto", className)}>
      {/* Label invisível superior estrutural para simetria vertical com os filtros */}
      <span className="block h-[15px] select-none text-[10px] font-bold uppercase tracking-wider text-transparent">
        Ação
      </span>
      <button
        onClick={onClear}
        type="button"
        className={cn(
          "inline-flex h-[38px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150",
          "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
          "dark:hover:border-rose-950 dark:hover:bg-rose-950/20 dark:hover:text-rose-400",
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
