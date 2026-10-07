import React from 'react';
import { cn } from '@/lib/utils';
import { SaasSegmentedControl } from '@/components/views/shared/SaasPrimitives';

type TableType = 'dia' | 'turno' | 'sub_praca' | 'origem' | 'dia_origem';

interface AnaliseTableTabsProps {
  activeTable: TableType;
  onTableChange: (table: TableType) => void;
}

export const AnaliseTableTabs = React.memo(function AnaliseTableTabs({
  activeTable,
  onTableChange,
}: AnaliseTableTabsProps) {
  const tabs: { id: TableType; label: string }[] = [
    { id: 'dia', label: 'Dia' },
    { id: 'turno', label: 'Turno' },
    { id: 'sub_praca', label: 'Sub-praça' },
    { id: 'origem', label: 'Origem' },
    { id: 'dia_origem', label: 'Dia × origem' },
  ];

  return (
    <div role="group" aria-label="Dimensão da análise" className="min-w-0 max-w-full">
      <SaasSegmentedControl className="w-full min-w-0 sm:w-auto">
        {tabs.map((tab) => {
          const isActive = activeTable === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTableChange(tab.id)}
              type="button"
              className={cn(
                'inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                isActive
                  ? 'bg-[#174d70] text-white shadow-sm dark:bg-sky-800 dark:text-white'
                  : 'text-slate-600 hover:bg-white hover:text-[#174d70] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              )}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </SaasSegmentedControl>
    </div>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';
