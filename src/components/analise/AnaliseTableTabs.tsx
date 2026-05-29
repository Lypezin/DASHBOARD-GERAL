/**
 * AnaliseTableTabs - Underline-style minimal tabs inspired by Stripe/GitHub.
 * Funciona perfeitamente em light e dark mode.
 */

import React from 'react';
import { cn } from '@/lib/utils';

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
    { id: 'dia', label: 'Por Dia' },
    { id: 'turno', label: 'Por Turno' },
    { id: 'sub_praca', label: 'Por Sub Praça' },
    { id: 'origem', label: 'Por Origem' },
  ];

  return (
    <div className="flex items-center border-b border-border/80 w-full md:w-auto shrink-0 select-none pb-0">
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const isActive = activeTable === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTableChange(tab.id)}
              className={cn(
                "relative pb-2 text-xs font-bold transition-all whitespace-nowrap focus:outline-none",
                "border-b-2 -mb-[1px]",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="px-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

AnaliseTableTabs.displayName = 'AnaliseTableTabs';
