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
  optionsLoading: boolean;
  optionsError: string | null;
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
  optionsLoading,
  optionsError,
}: DashboardFiltersContainerProps) {
  if (activeTab === 'marketing') {
    return null;
  }

  const isQuietOperationalTab = ['dashboard', 'entregadores', 'valores', 'utr', 'analise'].includes(activeTab);

  return (
    <div
      data-dashboard-filter-tab={activeTab}
      className={cn(
        "sticky top-[5.5625rem] z-30 mb-6 transition-[background-color,border-color,box-shadow] duration-200 lg:top-14",
        isQuietOperationalTab
          ? "dashboard-filters--entregadores rounded-none border-x-0 border-t-0 border-b border-[#d5e1e9] bg-[#f2f7fa] px-2 py-3 shadow-none ring-0 dark:border-[#263b4b] dark:bg-[#101c26]"
          : "rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.55)] ring-1 ring-white/70 dark:border-slate-800/70 dark:bg-slate-950/80 dark:ring-white/5 supports-[backdrop-filter]:backdrop-blur-xl"
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
        activeTab={activeTab}
        optionsLoading={optionsLoading}
        optionsError={optionsError}
      />
    </div>
  );
});

DashboardFiltersContainer.displayName = 'DashboardFiltersContainer';
