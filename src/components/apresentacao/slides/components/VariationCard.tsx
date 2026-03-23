
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
        <span className="text-base font-semibold text-slate-500 dark:text-slate-400 mb-1.5 text-center">
            {label}
        </span>

        {/* Variation value with arrow */}
        <div className={`flex items-center gap-1.5 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {positive ? (
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            <span className="text-3xl font-black">{value}</span>
        </div>

        {/* Percentage badge */}
        <div className={`mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-base font-bold ${percentualPositiva
            ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300'
            }`}>
            {percentualPositiva ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            {percentual}
        </div>
    </div>
);
