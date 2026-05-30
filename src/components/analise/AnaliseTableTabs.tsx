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
    { id: 'sub_praca', label: 'Sub Praca' },
    { id: 'origem', label: 'Origem' },
  ];

  return (
    <SaasSegmentedControl className="w-full md:w-auto">
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
                ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800'
                : 'text-slate-500 hover:-translate-y-0.5 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </SaasSegmentedControl>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';
