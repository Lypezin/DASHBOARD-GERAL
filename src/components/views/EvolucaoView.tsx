
import React from 'react';
import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { EvolucaoFilters } from './evolucao/EvolucaoFilters';
import { EvolucaoChart } from './evolucao/EvolucaoChart';
import { EvolucaoStatsCards } from './evolucao/EvolucaoStatsCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { useEvolucaoViewController } from './evolucao/hooks/useEvolucaoViewController';

const EvolucaoView = React.memo(function EvolucaoView({
  evolucaoMensal,
  evolucaoSemanal,
  loading,
  anoSelecionado,
}: {
  evolucaoMensal: EvolucaoMensal[];
  evolucaoSemanal: EvolucaoSemanal[];
  loading: boolean;
  anoSelecionado: number;
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



  return (
    <motion.div
      className="space-y-8 max-w-[1800px] mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeInItem}>
        <EvolucaoFilters
          viewMode={state.viewMode}
          onViewModeChange={actions.setViewMode}
          selectedMetrics={state.selectedMetrics}
          onMetricsChange={actions.setSelectedMetrics}
        />
      </motion.div>

      <motion.div variants={fadeInItem}>
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

      <motion.div variants={fadeInItem}>
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
