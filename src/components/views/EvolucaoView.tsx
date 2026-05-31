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
    initial: shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.996 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.998 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] },
  } as const;

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto animate-fade-in">
      <AnimatePresence mode="wait" initial={false}>
        {state.loading ? (
          <motion.div key="evolucao-loading" {...motionProps} className="min-w-0 transform-gpu will-change-transform">
            <DashboardSkeleton contentOnly />
          </motion.div>
        ) : (
          <motion.div
            key={`evolucao-content-${state.viewMode}-${anoSelecionado}`}
            {...motionProps}
            className="min-w-0 space-y-8 transform-gpu will-change-transform"
          >
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
    </div>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
