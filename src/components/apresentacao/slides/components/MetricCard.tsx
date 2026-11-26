
import React from 'react';

export const MetricCard: React.FC<{
    label: string;
    value: string;
    variant: 'week1' | 'week2';
}> = ({ label, value, variant }) => (
    <div className={`rounded-xl px-5 py-4 flex flex-col items-center justify-center h-full shadow-sm ${variant === 'week2'
        ? 'bg-gradient-to-br from-blue-50 to-white border border-blue-200 dark:from-blue-950/35 dark:to-slate-900 dark:border-blue-800/50'
        : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200 dark:from-slate-800/60 dark:to-slate-900 dark:border-slate-700'
        }`}>
        <span className="mb-1.5 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
        </span>
        <span className={`text-3xl font-black tabular-nums ${variant === 'week2' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {value}
        </span>
    </div>
);
