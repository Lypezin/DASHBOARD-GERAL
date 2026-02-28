/**
 * Componente para tabs de seleção de tabela - Design Stitch MCP
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
    <div
      className="p-1 rounded-lg flex overflow-x-auto max-w-full"
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTableChange(tab.id)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTable === tab.id
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';
