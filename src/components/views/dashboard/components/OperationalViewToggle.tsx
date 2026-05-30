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
      "flex p-1 bg-muted/40 border border-border/40 rounded-lg max-w-full overflow-x-auto flex-nowrap subtle-scrollbar select-none gap-1",
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
              "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap",
              isActive
                ? "bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-border/30 font-bold"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/60"
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
