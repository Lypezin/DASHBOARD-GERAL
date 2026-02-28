/**
 * AnaliseTableTabs - Design Elite Enterprise (Linear/Vercel style)
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
    <div className="bg-[#161f30] p-1 rounded-lg flex items-center border border-[#232f48]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTableChange(tab.id)}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeTable === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';
