import React from 'react';

export const VariationCard: React.FC<{
    label: string;
    value: string;
    positive: boolean;
    percentual: string;
    percentualPositiva: boolean;
}> = ({ label, value, positive, percentual, percentualPositiva }) => (
    <div className={`rounded-xl px-5 py-4 flex flex-col items-center justify-center h-full shadow-md ${positive
        ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-white dark:from-emerald-900/40 dark:via-emerald-800/20 dark:to-emerald-900/40 border border-emerald-300 dark:border-emerald-700/50'
        : 'bg-gradient-to-br from-rose-50 via-rose-100 to-white dark:from-rose-900/40 dark:via-rose-800/20 dark:to-rose-900/40 border border-rose-300 dark:border-rose-700/50'
        }`}>
        <span className="mb-1.5 text-center text-base font-semibold text-slate-500 dark:text-slate-400">
            {label}
        </span>

        <div className={`flex min-w-0 items-center gap-2 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            <span className="text-2xl leading-none" aria-hidden="true">{positive ? '🚀' : '⚠'}</span>
            <span className="min-w-0 text-3xl font-black leading-tight tracking-tight whitespace-nowrap">{value}</span>
        </div>

        <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-base font-bold ${percentualPositiva
            ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
            : 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
            }`}>
            <span aria-hidden="true">{percentualPositiva ? '🚀' : '⚠'}</span>
            {percentual}
        </div>
    </div>
);
