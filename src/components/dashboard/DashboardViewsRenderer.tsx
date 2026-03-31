'use client';

/**
 * Componente para renderizar as views do dashboard baseado na tab ativa
 * Extraído de src/app/page.tsx
 */

import React, { Suspense, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type {
  Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem,
  FilterOption, CurrentUser, TabType, DashboardFilters,
} from '@/types';
import { needsChartReady, renderActiveView } from './utils/viewRenderer';
import { useGamification } from '@/contexts/GamificationContext';

interface DashboardViewsRendererProps {
  activeTab: TabType; chartReady: boolean; aderenciaGeral?: AderenciaSemanal; aderenciaSemanal?: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[]; aderenciaTurno: AderenciaTurno[]; aderenciaSubPraca: AderenciaSubPraca[]; aderenciaOrigem: AderenciaOrigem[];
  totals?: Totals; utrData: any; loadingTabData: boolean; entregadoresData: any; valoresData: any; prioridadeData: any;
  evolucaoMensal: any; evolucaoSemanal: any; loadingEvolucao: boolean; anoSelecionado: number; anosDisponiveis: number[];
  onAnoChange: (ano: number) => void; semanas: string[]; pracas: FilterOption[]; subPracas: FilterOption[]; origens: FilterOption[];
  currentUser: CurrentUser | null; filters: DashboardFilters; setFilters?: (filters: DashboardFilters) => void; utrSemanal?: any[];
}


export const DashboardViewsRenderer = React.memo(function DashboardViewsRenderer(props: DashboardViewsRendererProps) {
  const { activeTab, chartReady } = props;
  const { registerInteraction } = useGamification();

  useEffect(() => {
    switch (activeTab) {
      case 'comparacao': registerInteraction('view_comparacao'); break;
      case 'resumo': registerInteraction('view_resumo'); break;
      case 'entregadores': registerInteraction('view_entregadores'); break;
      case 'evolucao': registerInteraction('view_evolucao'); break;
    }
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
