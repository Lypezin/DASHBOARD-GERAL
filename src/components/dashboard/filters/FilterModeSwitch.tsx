import React from 'react';
import { cn } from '@/lib/utils';

interface FilterModeSwitchProps {
    isModoIntervalo: boolean;
    onToggle: () => void;
}

export const FilterModeSwitch: React.FC<FilterModeSwitchProps> = ({ isModoIntervalo, onToggle }) => {
    return (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-900/70 sm:justify-start">
            <span className={cn(
                "text-sm transition-colors duration-300",
                !isModoIntervalo ? "text-blue-600 dark:text-blue-400 font-black" : "text-slate-500 font-semibold dark:text-slate-400"
            )}>
                Ano/Semana
            </span>
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full shadow-inner transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    isModoIntervalo ? "bg-gradient-to-r from-blue-600 to-sky-500" : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                )}
                role="switch"
                aria-checked={isModoIntervalo}
            >
                <span className="sr-only">Toggle Filter Mode</span>
                <span
                    className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150",
                        isModoIntervalo ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
            <span className={cn(
                "text-sm transition-colors duration-300",
                isModoIntervalo ? "text-blue-600 dark:text-blue-400 font-black" : "text-slate-500 font-semibold dark:text-slate-400"
            )}>
                Intervalo de Datas
            </span>
        </div>
    );
};
