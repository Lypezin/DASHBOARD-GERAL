/**
 * Container para os filtros do dashboard
 * Redesenhado em estilo Sticky HUD minimalista para SaaS Premium.
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
  // A aba 'marketing' gerencia seus próprios filtros internamente
  if (activeTab === 'marketing') {
    return null;
  }

  return (
    <Card className={cn(
      "sticky top-14 z-30 mb-6 overflow-visible rounded-xl", // Sincronizado com a altura h-14 do header
      "border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.01)]",
      "transition-all duration-200"
    )}>
      {/* Container compacto direto de filtros, sem rótulos ou cabeçalhos redundantes */}
      <CardContent className="p-4 relative">
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
