import React from 'react';
import { cn } from '@/lib/utils';

interface FilterModeSwitchProps {
  isModoIntervalo: boolean;
  onToggle: () => void;
  className?: string;
}

export const FilterModeSwitch: React.FC<FilterModeSwitchProps> = ({ isModoIntervalo, onToggle, className }) => {
  return (
    <div className={cn("flex flex-col gap-1 w-full sm:w-auto", className)}>
      {/* Label invisível superior estrutural para simetria vertical com os filtros */}
      <span className="block h-[15px] select-none text-[10px] font-bold uppercase tracking-wider text-transparent">
        Visualização
      </span>
      <div className={cn(
        "flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 h-[38px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] select-none w-full",
        "transition-all duration-150"
      )}>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider transition-colors duration-200",
          !isModoIntervalo ? "text-primary font-black" : "text-muted-foreground/75 hover:text-foreground"
        )}>
          Ano/Semana
        </span>
        
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
            isModoIntervalo ? "bg-primary" : "bg-muted hover:bg-muted-foreground/20"
          )}
          role="switch"
          aria-checked={isModoIntervalo}
        >
          <span className="sr-only">Toggle Filter Mode</span>
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
              isModoIntervalo ? "translate-x-4.5" : "translate-x-0.5"
            )}
          />
        </button>
        
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider transition-colors duration-200",
          isModoIntervalo ? "text-primary font-black" : "text-muted-foreground/75 hover:text-foreground"
        )}>
          Intervalo
        </span>
      </div>
    </div>
  );
};

export default FilterModeSwitch;
