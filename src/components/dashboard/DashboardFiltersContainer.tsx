/**
 * Container para os filtros do dashboard
 * Extraído de src/app/page.tsx
 */

import React from 'react';
import FiltroBar from '@/components/FiltroBar';
import type { Filters, FilterOption, CurrentUser } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-6">
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
