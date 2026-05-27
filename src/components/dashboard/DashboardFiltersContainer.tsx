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
      "sticky top-4 z-40 mb-5 overflow-visible rounded-3xl",
      "border border-slate-200/65 dark:border-slate-800/70",
      "bg-white/80 dark:bg-slate-950/75 supports-[backdrop-filter]:backdrop-blur-xl",
      "shadow-[0_18px_60px_-48px_rgba(15,23,42,0.78)]",
      "transition-[background-color,border-color,box-shadow] duration-200"
    )}>
      <CardContent className="p-4 sm:p-5">
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
