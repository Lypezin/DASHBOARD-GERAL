import React from 'react';
import { buildTimeTextStyle } from '../../utils';

export const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
    <div className={`flex-1 rounded-lg py-1.5 px-1.5 sm:px-2 flex flex-col justify-center items-center text-center ${positive ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50'}`}>
        <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 leading-tight w-full truncate" title={label}>{label}</p>
        <div className={`flex items-center justify-center gap-0.5 sm:gap-1 font-bold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {positive ? (
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            <span className="text-sm md:text-base leading-none tracking-tighter" style={buildTimeTextStyle(value, 1)}>{value}</span>
        </div>
    </div>
);
