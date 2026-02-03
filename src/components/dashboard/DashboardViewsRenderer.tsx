/**
 * Componente para renderizar as views do dashboard baseado na tab ativa
 * Extraído de src/app/page.tsx
 */

import React, { Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  FilterOption,
  CurrentUser,
  TabType,
  DashboardFilters,
} from '@/types';
import { needsChartReady, renderActiveView } from './utils/viewRenderer';

interface DashboardViewsRendererProps {
  activeTab: TabType;
  chartReady: boolean;
  // Dashboard props
  aderenciaGeral?: AderenciaSemanal;
  aderenciaSemanal?: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  // Analise props
  totals?: Totals;
  // UTR props
  utrData: any;
  loadingTabData: boolean;
  // Entregadores props
  entregadoresData: any;
  // Valores props
  valoresData: any;
  // Prioridade props
  prioridadeData: any;
  // Evolução props
  evolucaoMensal: any;
  evolucaoSemanal: any;
  loadingEvolucao: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
  // Comparação props
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: CurrentUser | null;
  filters: DashboardFilters;
  setFilters?: (filters: DashboardFilters) => void;
  // UTR Semanal from evolution data
  utrSemanal?: any[];
}



import { useGamification } from '@/contexts/GamificationContext';

export const DashboardViewsRenderer = React.memo(function DashboardViewsRenderer(props: DashboardViewsRendererProps) {
  const { activeTab, chartReady } = props;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTab, setPreviousTab] = useState(activeTab);

  const { registerInteraction } = useGamification();

  // Track Tab Views
  useEffect(() => {
    switch (activeTab) {
      case 'comparacao':
        registerInteraction('view_comparacao');
        break;
      case 'resumo':
        registerInteraction('view_resumo');
        break;
      case 'entregadores':
        registerInteraction('view_entregadores');
        break;
      case 'evolucao':
        registerInteraction('view_evolucao');
        break;
    }
  }, [activeTab, registerInteraction]);

  useEffect(() => {
    if (previousTab !== activeTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPreviousTab(activeTab);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, previousTab]);

  // Verificar se precisa esperar Chart.js
  const needsChart = needsChartReady(activeTab);

  if (needsChart && !chartReady) {
    return <DashboardSkeleton contentOnly />;
  }

  if (isTransitioning) {
    return <DashboardSkeleton contentOnly />;
  }

  return (
    <ErrorBoundary>
      <div className="animate-in fade-in-0 duration-500">
        <Suspense fallback={<DashboardSkeleton contentOnly />}>
          {renderActiveView(activeTab, props)}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
});

DashboardViewsRenderer.displayName = 'DashboardViewsRenderer';
