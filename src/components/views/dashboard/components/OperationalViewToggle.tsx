import React from 'react';
import { cn } from '@/lib/utils';

export type ViewMode = 'dia' | 'turno' | 'sub_praca' | 'origem' | 'ranking';

interface OperationalViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export const OperationalViewToggle: React.FC<OperationalViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className
}) => {
  return (
    <div className={cn(
      "flex p-0.5 bg-muted/65 border border-border/40 rounded-lg max-w-full overflow-x-auto flex-nowrap subtle-scrollbar select-none",
      className
    )}>
      {(['dia', 'turno', 'sub_praca', 'origem', 'ranking'] as const).map((mode) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            type="button"
            className={cn(
              "px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 whitespace-nowrap",
              isActive
                ? "bg-card text-foreground shadow-sm font-black"
                : "text-muted-foreground/80 hover:text-foreground"
            )}
          >
            {mode === 'sub_praca' 
              ? 'Sub Praça' 
              : mode === 'ranking' 
              ? 'Ranking Sub Praça' 
              : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        );
      })}
    </div>
  );
};

export default OperationalViewToggle;
