/**
 * Container para os filtros do dashboard
 * Extraído de src/app/page.tsx
 */

import React from 'react';
import FiltroBar from '@/components/FiltroBar';
import type { Filters, FilterOption, CurrentUser } from '@/types';

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
  // Não mostrar filtros em comparação e marketing
  if (activeTab === 'comparacao' || activeTab === 'marketing') {
    return null;
  }

  return (
    <div className="relative group" style={{ zIndex: 1 }}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl border-0 shadow-xl p-6 sm:p-8 backdrop-blur-sm" style={{ overflow: 'visible' }}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative" style={{ zIndex: 1 }}>
          <FiltroBar
            filters={filters}
            setFilters={setFilters}
            anos={anosDisponiveis}
            semanas={semanasDisponiveis}
            pracas={pracas}
            subPracas={subPracas}
            origens={origens}
            turnos={turnos}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
});

DashboardFiltersContainer.displayName = 'DashboardFiltersContainer';

