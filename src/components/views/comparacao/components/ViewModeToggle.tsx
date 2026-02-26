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
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
      <button
        onClick={() => onViewModeChange('table')}
        className={`flex items-center gap-1.5 ${isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-semibold rounded-lg transition-all duration-200 ${
          viewMode === 'table'
            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <FileSpreadsheet className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Tabela
      </button>
      <button
        onClick={() => onViewModeChange('chart')}
        className={`flex items-center gap-1.5 ${isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-semibold rounded-lg transition-all duration-200 ${
          viewMode === 'chart'
            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <BarChart2 className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Gráfico
      </button>
    </div>
  );
};
