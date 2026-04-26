'use client';

import React from 'react';
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
    <div className="space-y-8 max-w-[1800px] mx-auto animate-fade-in">
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
    </div>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
