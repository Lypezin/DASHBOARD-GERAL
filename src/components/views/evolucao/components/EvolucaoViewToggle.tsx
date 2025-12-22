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
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
            <button
                onClick={() => onViewModeChange('mensal')}
                className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    viewMode === 'mensal'
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
            >
                <Calendar className="h-4 w-4" />
                Mensal
            </button>
            <button
                onClick={() => onViewModeChange('semanal')}
                className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    viewMode === 'semanal'
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
            >
                <BarChart2 className="h-4 w-4" />
                Semanal
            </button>
        </div>
    );
};
