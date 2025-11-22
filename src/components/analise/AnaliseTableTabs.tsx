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
  const tabs: { id: TableType; label: string; icon: string }[] = [
    { id: 'dia', label: 'Por Dia', icon: '📅' },
    { id: 'turno', label: 'Por Turno', icon: '🕐' },
    { id: 'sub_praca', label: 'Por Sub Praça', icon: '📍' },
    { id: 'origem', label: 'Por Origem', icon: '🏢' },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTableChange(tab.id)}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTable === tab.id
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
              : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';

