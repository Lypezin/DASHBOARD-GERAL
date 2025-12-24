
import React from 'react';
import { EntregadoresData } from '@/types';
import { usePrioridadeViewController } from './prioridade/usePrioridadeViewController';
import { PrioridadeEmptyState, PrioridadeErrorState } from './prioridade/components/PrioridadeEmptyStates';
import { PrioridadeLayout } from './prioridade/PrioridadeLayout';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

const PrioridadePromoView = React.memo(function PrioridadePromoView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const { state, actions } = usePrioridadeViewController(entregadoresData, loading);

  if (state.loading) {
    return <DashboardSkeleton contentOnly />;
  }

  if (!state.entregadoresData) {
    return <PrioridadeErrorState />;
  }

  if (state.entregadoresData.entregadores.length === 0) {
    return <PrioridadeEmptyState />;
  }

  return (
    <PrioridadeLayout
      sortedEntregadores={state.sortedEntregadores}
      dataFiltradaLength={state.dataFiltrada.length}
      sortField={state.sortField}
      sortDirection={state.sortDirection}
      searchTerm={state.searchTerm}
      isSearching={state.isSearching}
      filtroAderencia={state.filtroAderencia}
      filtroRejeicao={state.filtroRejeicao}
      filtroCompletadas={state.filtroCompletadas}
      filtroAceitas={state.filtroAceitas}
      stats={state.stats}
      onSearchChange={actions.setSearchTerm}
      onClearSearch={() => actions.setSearchTerm('')}
      onAderenciaChange={actions.setFiltroAderencia}
      onRejeicaoChange={actions.setFiltroRejeicao}
      onCompletadasChange={actions.setFiltroCompletadas}
      onAceitasChange={actions.setFiltroAceitas}
      onClearFilters={actions.handleClearFilters}
      onSort={actions.handleSort}
    />
  );
});

PrioridadePromoView.displayName = 'PrioridadePromoView';

export default PrioridadePromoView;
