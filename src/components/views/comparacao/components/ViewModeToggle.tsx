import React from 'react';
import { FileSpreadsheet, BarChart2 } from 'lucide-react';

interface ViewModeToggleProps {
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    size?: 'sm' | 'md';
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
    viewMode,
    onViewModeChange,
    size = 'md',
}) => {
    const isSmall = size === 'sm';

    return (
        <div className="inline-flex rounded-full border border-slate-200/80 bg-slate-100/85 p-1 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.42)] dark:border-slate-800/80 dark:bg-slate-900/78">
            <button
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-1 rounded-full font-medium transition-[background-color,color,box-shadow,transform] duration-200 ${isSmall ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'} ${viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/70 dark:bg-slate-50 dark:text-slate-900'
                    : 'text-slate-500 hover:-translate-y-0.5 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
            >
                <FileSpreadsheet className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                Tabela
            </button>
            <button
                onClick={() => onViewModeChange('chart')}
                className={`flex items-center gap-1 rounded-full font-medium transition-[background-color,color,box-shadow,transform] duration-200 ${isSmall ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'} ${viewMode === 'chart'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/70 dark:bg-slate-50 dark:text-slate-900'
                    : 'text-slate-500 hover:-translate-y-0.5 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
            >
                <BarChart2 className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                Grafico
            </button>
        </div>
    );
};
