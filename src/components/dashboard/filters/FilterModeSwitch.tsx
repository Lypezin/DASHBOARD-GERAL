import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilterModeSwitchProps {
    isModoIntervalo: boolean;
    onToggle: () => void;
}

export const FilterModeSwitch: React.FC<FilterModeSwitchProps> = ({ isModoIntervalo, onToggle }) => {
    return (
        <div className="flex items-center justify-center sm:justify-start gap-3 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
            <span className={cn(
                "text-sm transition-colors duration-300",
                !isModoIntervalo ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500 font-medium dark:text-slate-400"
            )}>
                Ano/Semana
            </span>
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors duration-300",
                    isModoIntervalo ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                )}
                role="switch"
                aria-checked={isModoIntervalo}
            >
                <span className="sr-only">Toggle Filter Mode</span>
                <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm",
                        isModoIntervalo ? "ml-6" : "ml-1"
                    )}
                />
            </button>
            <span className={cn(
                "text-sm transition-colors duration-300",
                isModoIntervalo ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500 font-medium dark:text-slate-400"
            )}>
                Intervalo de Datas
            </span>
        </div>
    );
};
