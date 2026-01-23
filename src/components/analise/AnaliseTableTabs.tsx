/**
 * Componente para tabs de seleção de tabela
 * Extraído de src/components/views/AnaliseView.tsx
 */

import React from 'react';

type TableType = 'dia' | 'turno' | 'sub_praca' | 'origem';

interface AnaliseTableTabsProps {
  activeTable: TableType;
  onTableChange: (table: TableType) => void;
}

export const AnaliseTableTabs = React.memo(function AnaliseTableTabs({
  activeTable,
  onTableChange,
}: AnaliseTableTabsProps) {
  const tabs: { id: TableType; label: string }[] = [
    { id: 'dia', label: 'Por Dia' },
    { id: 'turno', label: 'Por Turno' },
    { id: 'sub_praca', label: 'Por Sub Praça' },
    { id: 'origem', label: 'Por Origem' },
  ];

  return (
    <div className="flex gap-2 flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTableChange(tab.id)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTable === tab.id
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';

