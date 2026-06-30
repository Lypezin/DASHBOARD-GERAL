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
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { scheduleIdleTask } from '@/utils/scheduling/idleTask';

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
}

export type DashboardViewRenderProps = DashboardViewsRendererProps;

export const DashboardViewsRenderer = React.memo(function DashboardViewsRenderer(props: DashboardViewsRendererProps) {
  const { activeTab, chartReady } = props;
  const { registerInteraction } = useGamification();
  const shouldReduceMotion = useReducedMotion();

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

  if (needsChart && !chartReady) {
    return <DashboardSkeleton contentOnly />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton contentOnly />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.09, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 w-full"
          >
            {renderActiveView(activeTab, props)}
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </ErrorBoundary>
  );
});

DashboardViewsRenderer.displayName = 'DashboardViewsRenderer';
