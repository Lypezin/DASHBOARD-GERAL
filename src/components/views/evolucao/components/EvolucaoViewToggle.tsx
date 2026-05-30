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
        <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 shadow-inner dark:border-slate-800/80 dark:bg-slate-900/80">
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
            className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-200",
                active
                    ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}
