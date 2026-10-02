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
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <span className="select-none pl-0.5 text-[11px] font-semibold text-muted-foreground">Período</span>
      <div className="flex h-10 w-full items-center rounded-md border border-input bg-background p-1 text-xs sm:w-auto">
        <CalendarRange className="mx-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <button
          type="button"
          onClick={() => { if (isModoIntervalo) onToggle(); }}
          aria-pressed={!isModoIntervalo}
          className={cn(
            "h-full flex-1 whitespace-nowrap rounded px-2 font-semibold transition-colors sm:flex-none",
            !isModoIntervalo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Ano/Semana
        </button>
        <button
          type="button"
          onClick={() => { if (!isModoIntervalo) onToggle(); }}
          aria-pressed={isModoIntervalo}
          className={cn(
            "h-full flex-1 whitespace-nowrap rounded px-2 font-semibold transition-colors sm:flex-none",
            isModoIntervalo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Intervalo
        </button>
      </div>
    </div>
  );
};

export default FilterModeSwitch;
