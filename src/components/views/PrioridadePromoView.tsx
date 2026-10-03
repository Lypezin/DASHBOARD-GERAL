'use client';

import React from 'react';
import { usePrioridadeViewController } from './prioridade/usePrioridadeViewController';
import { PrioridadeEmptyState, PrioridadeErrorState } from './prioridade/components/PrioridadeEmptyStates';
import { PrioridadeLayout } from './prioridade/PrioridadeLayout';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ViewTransition } from '@/components/ui/view-transition';

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
  const { data: tabData, loading, error, retry } = useTabData('prioridade', filterPayload, currentUser);
  const { prioridadeData } = useTabDataMapper({ activeTab: 'prioridade', tabData });
  const { state, actions } = usePrioridadeViewController(prioridadeData, loading);

  if (state.loading && (!state.entregadoresData || state.entregadoresData.entregadores.length === 0)) {
    return (
      <ViewTransition stateKey="prioridade-loading">
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  if (error && (!state.entregadoresData || state.entregadoresData.entregadores.length === 0)) {
    return (
      <ViewTransition stateKey="prioridade-error">
        <PrioridadeErrorState onRetry={retry} />
      </ViewTransition>
    );
  }

  if (!state.entregadoresData) {
    return (
      <ViewTransition stateKey="prioridade-error">
        <PrioridadeErrorState onRetry={retry} />
      </ViewTransition>
    );
  }

  if (state.entregadoresData.entregadores.length === 0) {
    return (
      <ViewTransition stateKey="prioridade-empty">
        <PrioridadeEmptyState />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey="prioridade-content" className="w-full">
      {error ? (
        <div role="alert" className="mb-4 rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
          Não foi possível atualizar a Prioridade. Exibindo a resposta válida anterior.
        </div>
      ) : null}
      {state.loading ? (
        <div className="mb-4 rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200">
          Atualizando prioridade com os filtros atuais...
        </div>
      ) : null}
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
        exportDisabled={loading || Boolean(error) || state.isSearching}
        exportFilters={{
          ...filterPayload,
          p_search: state.searchTerm || null,
          p_filtro_aderencia: state.filtroAderencia,
          p_filtro_rejeicao: state.filtroRejeicao,
          p_filtro_completadas: state.filtroCompletadas,
          p_filtro_aceitas: state.filtroAceitas,
        }}
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
    </ViewTransition>
  );
});

PrioridadePromoView.displayName = 'PrioridadePromoView';

export default PrioridadePromoView;
