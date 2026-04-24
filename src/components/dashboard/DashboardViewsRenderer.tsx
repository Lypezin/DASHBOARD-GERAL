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
  // Dados principais passados para as views (Restaurando arquitetura monolítica)
  totals: Totals | null;
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  aderenciaDiaOrigem: AderenciaDiaOrigem[];
}


export const DashboardViewsRenderer = React.memo(function DashboardViewsRenderer(props: DashboardViewsRendererProps) {
  const { activeTab, chartReady } = props;
  const { registerInteraction } = useGamification();

  useEffect(() => {
    const interactionMap = {
      comparacao: 'view_comparacao',
      resumo: 'view_resumo',
      entregadores: 'view_entregadores',
      evolucao: 'view_evolucao',
    } as const;

    const interaction = interactionMap[activeTab as keyof typeof interactionMap];
    if (!interaction) return;

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const run = () => registerInteraction(interaction);

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: 1200 });
    } else if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(run, 250);
    } else {
      run();
    }

    return () => {
      if (idleId !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeTab, registerInteraction]);

  const needsChart = needsChartReady(activeTab);

  if (needsChart && !chartReady) {
    return <DashboardSkeleton contentOnly />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton contentOnly />}>
        {renderActiveView(activeTab, props)}
      </Suspense>
    </ErrorBoundary>
  );
});

DashboardViewsRenderer.displayName = 'DashboardViewsRenderer';
