'use client';

import React from 'react';
import { EntregadoresData } from '@/types';
import { usePrioridadeViewController } from './prioridade/usePrioridadeViewController';
import { PrioridadeEmptyState, PrioridadeErrorState } from './prioridade/components/PrioridadeEmptyStates';
import { PrioridadeLayout } from './prioridade/PrioridadeLayout';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

const PrioridadePromoView = React.memo(function PrioridadePromoView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const { data: tabData, loading } = useTabData('prioridade', filterPayload, currentUser);
  const { prioridadeData } = useTabDataMapper({ activeTab: 'prioridade', tabData });
  const { state, actions } = usePrioridadeViewController(prioridadeData, loading);

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
      paginatedEntregadores={state.paginatedEntregadores}
      dataFiltradaLength={state.dataFiltrada.length}
      hasMore={state.hasMore}
      onLoadMore={actions.loadMore}
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
