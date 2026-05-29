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

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  analise: 'Analise',
  utr: 'UTR',
  entregadores: 'Entregadores',
  valores: 'Valores',
  prioridade: 'Prioridade | Promo',
  evolucao: 'Evolucao',
  comparacao: 'Comparacao',
  marketing_comparacao: 'Operacional | Marketing',
  marketing: 'Marketing',
  dedicado: 'DEDICADO',
};

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
      "sticky top-[4.75rem] z-40 mb-5 overflow-visible rounded-3xl",
      "border border-slate-200/65 dark:border-slate-800/70",
      "bg-white/82 dark:bg-slate-950/78 supports-[backdrop-filter]:backdrop-blur-xl",
      "shadow-[0_18px_56px_-48px_rgba(15,23,42,0.72)]",
      "transition-[background-color,border-color,box-shadow] duration-200"
    )}>
      <CardContent className="relative p-3.5 sm:p-4 lg:p-5">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/65 to-transparent dark:via-blue-700/55" />
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)] dark:shadow-[0_0_0_4px_rgba(59,130,246,0.16)]" />
            Filtros do painel
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-slate-200/80 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/75 dark:text-slate-400">
            {TAB_LABELS[activeTab] || activeTab}
          </span>
        </div>
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
