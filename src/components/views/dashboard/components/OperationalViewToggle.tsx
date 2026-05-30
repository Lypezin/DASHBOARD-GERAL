import React from 'react';
import { CalendarDays, Clock3, MapPin, Route, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className={cn(
      "subtle-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60",
      className
    )}>
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              isActive
                ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default OperationalViewToggle;
