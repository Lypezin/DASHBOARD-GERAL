
import React from 'react';
import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { EvolucaoFilters } from './evolucao/EvolucaoFilters';
import { EvolucaoChart } from './evolucao/EvolucaoChart';
import { EvolucaoStatsCards } from './evolucao/EvolucaoStatsCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { motion, Variants } from 'framer-motion';
import { useEvolucaoViewController } from './evolucao/hooks/useEvolucaoViewController';

const EvolucaoView = React.memo(function EvolucaoView({
  evolucaoMensal,
  evolucaoSemanal,
  loading,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
}: {
  evolucaoMensal: EvolucaoMensal[];
  evolucaoSemanal: EvolucaoSemanal[];
  loading: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
}) {
  const { state, actions } = useEvolucaoViewController({
    evolucaoMensal,
    evolucaoSemanal,
    loading,
    anoSelecionado
  });

  if (state.loading) {
    return <DashboardSkeleton contentOnly />;
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <EvolucaoFilters
          viewMode={state.viewMode}
          onViewModeChange={actions.setViewMode}
          anoSelecionado={anoSelecionado}
          anosDisponiveis={anosDisponiveis}
          onAnoChange={onAnoChange}
          selectedMetrics={state.selectedMetrics}
          onMetricsChange={actions.setSelectedMetrics}
        />
      </motion.div>

      <motion.div variants={item}>
        <EvolucaoChart
          chartData={state.chartData}
          chartOptions={state.chartOptions}
          chartError={state.chartError}
          anoSelecionado={anoSelecionado}
          selectedMetrics={state.selectedMetrics}
          viewMode={state.viewMode}
          dadosAtivosLength={state.totalPeriodos}
        />
      </motion.div>

      <motion.div variants={item}>
        <EvolucaoStatsCards
          dadosAtivos={state.dadosAtivos}
          viewMode={state.viewMode}
          anoSelecionado={anoSelecionado}
        />
      </motion.div>
    </motion.div>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
