'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EvolucaoFilters } from './evolucao/EvolucaoFilters';
import { EvolucaoChart } from './evolucao/EvolucaoChart';
import { EvolucaoStatsCards } from './evolucao/EvolucaoStatsCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEvolucaoViewController } from './evolucao/hooks/useEvolucaoViewController';
import { useDashboardEvolucao } from '@/hooks/dashboard/useDashboardEvolucao';
import type { FilterPayload } from '@/types/filters';
import { ViewContainer } from '@/components/layout/ViewContainer';

const EvolucaoView = React.memo(function EvolucaoView({
  filterPayload,
  anoSelecionado,
  onAnoChange,
}: {
  filterPayload: FilterPayload;
  anoSelecionado: number;
  onAnoChange?: (ano: number) => void;
}) {
  const { evolucaoMensal, evolucaoSemanal, loading } = useDashboardEvolucao({
    filterPayload,
    anoEvolucao: anoSelecionado,
    activeTab: 'evolucao'
  });
  const shouldReduceMotion = useReducedMotion();

  const { state, actions } = useEvolucaoViewController({
    evolucaoMensal,
    evolucaoSemanal,
    loading,
    anoSelecionado
  });

  const motionProps = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 4 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.08, ease: [0.22, 1, 0.36, 1] },
  } as const;

  return (
    <ViewContainer className="space-y-8">
      <AnimatePresence mode="wait" initial={false}>
        {state.loading && state.totalPeriodos === 0 ? (
          <motion.div key="evolucao-loading" {...motionProps} className="min-w-0">
            <DashboardSkeleton contentOnly />
          </motion.div>
        ) : (
          <motion.div
            key={`evolucao-content-${state.viewMode}-${anoSelecionado}`}
            {...motionProps}
            className="min-w-0 space-y-8"
          >
            {state.loading ? (
              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200">
                Atualizando evolucao com os filtros atuais...
              </div>
            ) : null}

            <EvolucaoFilters
              viewMode={state.viewMode}
              onViewModeChange={actions.setViewMode}
              selectedMetrics={state.selectedMetrics}
              onMetricsChange={actions.setSelectedMetrics}
            />

            <EvolucaoChart
              chartData={state.chartData}
              chartOptions={state.chartOptions}
              chartError={state.chartError}
              anoSelecionado={anoSelecionado}
              selectedMetrics={state.selectedMetrics}
              viewMode={state.viewMode}
              dadosAtivosLength={state.totalPeriodos}
            />

            <EvolucaoStatsCards
              dadosAtivos={state.dadosAtivos}
              viewMode={state.viewMode}
              anoSelecionado={anoSelecionado}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ViewContainer>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
