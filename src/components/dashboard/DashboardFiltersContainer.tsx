/**
 * Container para os filtros do dashboard
 * Extraído de src/app/page.tsx
 */

import React from 'react';
import FiltroBar from '@/components/FiltroBar';
import type { Filters, FilterOption, CurrentUser } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardFiltersContainerProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anosDisponiveis: number[];
  semanasDisponiveis: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  turnos: FilterOption[];
  currentUser: CurrentUser | null;
  activeTab: string;
}

export const DashboardFiltersContainer = React.memo(function DashboardFiltersContainer({
  filters,
  setFilters,
  anosDisponiveis,
  semanasDisponiveis,
  pracas,
  subPracas,
  origens,
  turnos,
  currentUser,
  activeTab,
}: DashboardFiltersContainerProps) {
  if (activeTab === 'marketing') {
    return null;
  }

  return (
    <Card className={cn(
      "border border-slate-200/50 dark:border-slate-800/50 shadow-sm",
      "bg-white/95 dark:bg-slate-900/95 supports-[backdrop-filter]:backdrop-blur-sm",
      "sticky top-4 z-40 mb-6 transition-[background-color,border-color,box-shadow] duration-200",
      "hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-700/50",
      "hover:ring-1 hover:ring-slate-200/70 dark:hover:ring-slate-800 rounded-2xl"
    )}>
      <CardContent className="p-4 sm:p-6">
        <FiltroBar
          filters={filters}
          setFilters={setFilters}
          anos={anosDisponiveis}
          semanas={semanasDisponiveis.map(String)}
          pracas={pracas}
          subPracas={subPracas}
          origens={origens}
          turnos={turnos}
          currentUser={currentUser}
        />
      </CardContent>
    </Card>
  );
});

DashboardFiltersContainer.displayName = 'DashboardFiltersContainer';
