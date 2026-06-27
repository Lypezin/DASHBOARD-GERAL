import React from 'react';
import FiltroBar from '@/components/shared/filters/FiltroBar';
import type { Filters, FilterOption, CurrentUser } from '@/types';
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
    <div
      className={cn(
        "sticky top-14 z-30 mb-6 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.55)] ring-1 ring-white/70 transition-[background-color,border-color,box-shadow] duration-200 dark:border-slate-800/70 dark:bg-slate-950/80 dark:ring-white/5",
        "supports-[backdrop-filter]:backdrop-blur-xl"
      )}
    >
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
    </div>
  );
});

DashboardFiltersContainer.displayName = 'DashboardFiltersContainer';
