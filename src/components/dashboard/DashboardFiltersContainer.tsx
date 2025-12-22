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
  // Não mostrar filtros em marketing
  if (activeTab === 'marketing') {
    return null;
  }

  <Card className="border-none shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-4 z-40 mb-6 transition-all duration-300 hover:shadow-md">
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
