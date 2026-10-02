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
        "relative z-30 mb-5 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:sticky lg:top-16",
        "transition-colors duration-200"
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
