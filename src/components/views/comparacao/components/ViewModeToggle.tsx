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
    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
      <button
        onClick={() => onViewModeChange('table')}
        className={`flex items-center gap-1 ${isSmall ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'} font-medium rounded-md transition-colors ${viewMode === 'table'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
      >
        <FileSpreadsheet className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Tabela
      </button>
      <button
        onClick={() => onViewModeChange('chart')}
        className={`flex items-center gap-1 ${isSmall ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'} font-medium rounded-md transition-colors ${viewMode === 'chart'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
      >
        <BarChart2 className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Gráfico
      </button>
    </div>
  );
};
