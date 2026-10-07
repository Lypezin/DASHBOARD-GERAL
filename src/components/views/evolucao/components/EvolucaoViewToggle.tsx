import React from 'react';
import { Calendar, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvolucaoViewToggleProps {
    viewMode: 'mensal' | 'semanal';
    onViewModeChange: (mode: 'mensal' | 'semanal') => void;
}

export const EvolucaoViewToggle: React.FC<EvolucaoViewToggleProps> = ({
    viewMode,
    onViewModeChange,
}) => {
    return (
        <div role="group" aria-label="Período do gráfico" className="inline-flex rounded-lg border border-[#d8e4eb] bg-[#f6f9fb] p-1 dark:border-slate-700 dark:bg-slate-900">
            <ToggleButton active={viewMode === 'mensal'} onClick={() => onViewModeChange('mensal')} icon={Calendar} label="Mensal" />
            <ToggleButton active={viewMode === 'semanal'} onClick={() => onViewModeChange('semanal')} icon={BarChart2} label="Semanal" />
        </div>
    );
};

function ToggleButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            type="button"
            aria-pressed={active}
            className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-1 motion-reduce:transition-none",
                active
                    ? "bg-white text-[#174d70] shadow-sm dark:bg-slate-800 dark:text-sky-200"
                    : "text-slate-600 hover:text-[#183f58] dark:text-slate-400 dark:hover:text-slate-100"
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}
