'use client';

/**
 * Componente para renderizar as views do dashboard baseado na tab ativa
 * Extraído de src/app/page.tsx
 */

import React, { Suspense, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type {
  Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem, AderenciaDiaOrigem,
  FilterOption, CurrentUser, TabType, DashboardFilters,
} from '@/types';
import type { FilterPayload } from '@/types/filters';
import { needsChartReady, renderActiveView } from './utils/viewRenderer';
import { useGamification } from '@/contexts/GamificationContext';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';
import { ViewTransition } from '@/components/ui/view-transition';

interface DashboardViewsRendererProps {
  activeTab: TabType;
  chartReady: boolean;
  currentUser: CurrentUser | null;
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  filterPayload: FilterPayload;
  anoEvolucao: number;
  onAnoChange: (ano: number) => void;
  // Opções para filtros que podem ser necessárias em sub-views
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  // Dados principais passados para as views
  totals: Totals | null;
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  aderenciaDiaOrigem: AderenciaDiaOrigem[];
  mainDataLoading: boolean;
  mainDataError: string | null;
  retryMainData: () => void;
}

export type DashboardViewRenderProps = DashboardViewsRendererProps;

export const DashboardViewsRenderer = React.memo(function DashboardViewsRenderer(props: DashboardViewsRendererProps) {
  const { activeTab, chartReady } = props;
  const { registerInteraction } = useGamification();

  useEffect(() => {
    const interactionMap = {
      comparacao: 'view_comparacao',
      dedicado: 'view_entregadores',
      entregadores: 'view_entregadores',
      evolucao: 'view_evolucao',
    } as const;

    const interaction = interactionMap[activeTab as keyof typeof interactionMap];
    if (!interaction) return;

    const run = () => registerInteraction(interaction);
    return scheduleIdleTask(run, { timeoutMs: 1200, fallbackDelayMs: 250 });
  }, [activeTab, registerInteraction]);

  const needsChart = needsChartReady(activeTab);

  const viewStateKey = needsChart && !chartReady ? `chart-loading-${activeTab}` : activeTab;

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton contentOnly />}>
        <ViewTransition stateKey={viewStateKey}>
          {needsChart && !chartReady ? (
            <div className="min-w-0 w-full">
              <DashboardSkeleton contentOnly />
            </div>
          ) : (
            <div className="min-w-0 w-full">
              {renderActiveView(activeTab, props)}
            </div>
          )}
        </ViewTransition>
      </Suspense>
    </ErrorBoundary>
  );
});

DashboardViewsRenderer.displayName = 'DashboardViewsRenderer';
