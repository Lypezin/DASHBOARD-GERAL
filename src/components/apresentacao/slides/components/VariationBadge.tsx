import React from 'react';
import { buildTimeTextStyle } from '../../utils';

export const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
    <div className={`min-w-0 rounded-lg py-2 px-2 flex flex-col justify-center items-center text-center ${positive ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50'}`}>
        <p className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 leading-tight w-full truncate" title={label}>{label}</p>
        <div className={`flex min-w-0 items-center justify-center gap-1 font-bold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            <span className="text-sm leading-none" aria-hidden="true">{positive ? '🚀' : '⚠'}</span>
            <span className="min-w-0 text-sm md:text-base leading-none tracking-tighter whitespace-nowrap" style={buildTimeTextStyle(value, 1)}>{value}</span>
        </div>
    </div>
);
