import React from 'react';
import { CalendarDays, Clock3, MapPin, Route, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaasSegmentedControl } from '@/components/views/shared/SaasPrimitives';

export type ViewMode = 'dia' | 'turno' | 'sub_praca' | 'origem' | 'ranking';

interface OperationalViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

const options: Array<{ mode: ViewMode; label: string; icon: React.ElementType }> = [
  { mode: 'dia', label: 'Dia', icon: CalendarDays },
  { mode: 'turno', label: 'Turno', icon: Clock3 },
  { mode: 'sub_praca', label: 'Sub-praça', icon: MapPin },
  { mode: 'origem', label: 'Origem', icon: Route },
  { mode: 'ranking', label: 'Ranking', icon: Trophy },
];

export const OperationalViewToggle: React.FC<OperationalViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className
}) => {
  return (
    <div role="group" aria-label="Dimensão do detalhamento" className="min-w-0 max-w-full">
      <SaasSegmentedControl className={className}>
        {options.map(({ mode, label, icon: Icon }) => {
          const isActive = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              type="button"
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30",
                isActive
                  ? "bg-[#174d70] text-white shadow-sm dark:bg-sky-800 dark:text-white"
                  : "text-slate-600 hover:bg-white hover:text-[#174d70] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
              aria-pressed={isActive}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-sky-100" : "text-slate-400")} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </SaasSegmentedControl>
    </div>
  );
};

export default OperationalViewToggle;
