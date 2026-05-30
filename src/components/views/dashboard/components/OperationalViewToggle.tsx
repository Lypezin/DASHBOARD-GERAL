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
  { mode: 'sub_praca', label: 'Sub Praca', icon: MapPin },
  { mode: 'origem', label: 'Origem', icon: Route },
  { mode: 'ranking', label: 'Ranking', icon: Trophy },
];

export const OperationalViewToggle: React.FC<OperationalViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className
}) => {
  return (
    <SaasSegmentedControl className={className}>
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            type="button"
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-200",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              isActive
                ? "bg-white text-slate-950 shadow-[0_8px_22px_-16px_rgba(15,23,42,0.65)] ring-1 ring-slate-200/70 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800"
                : "text-slate-500 hover:-translate-y-0.5 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-500" : "text-slate-400")} />
            {label}
          </button>
        );
      })}
    </SaasSegmentedControl>
  );
};

export default OperationalViewToggle;
