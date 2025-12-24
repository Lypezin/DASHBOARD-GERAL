
import React from 'react';

interface FilterClearButtonProps {
    onClear: () => void;
}

export const FilterClearButton: React.FC<FilterClearButtonProps> = ({ onClear }) => {
    return (
        <div className="flex-shrink-0">
            <button
                onClick={onClear}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 h-[40px]"
            >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpar
            </button>
        </div>
    );
};
