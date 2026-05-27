
import React from 'react';

interface FilterClearButtonProps {
    onClear: () => void;
}

export const FilterClearButton: React.FC<FilterClearButtonProps> = ({ onClear }) => {
    return (
        <div className="flex-shrink-0">
            <button
                onClick={onClear}
                className="inline-flex h-[44px] items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_12px_28px_-22px_rgba(225,29,72,0.8)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpar
            </button>
        </div>
    );
};
