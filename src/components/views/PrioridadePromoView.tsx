'use client';

import React from 'react';
import { usePrioridadeViewController } from './prioridade/usePrioridadeViewController';
import { PrioridadeEmptyState, PrioridadeErrorState } from './prioridade/components/PrioridadeEmptyStates';
import { PrioridadeLayout } from './prioridade/PrioridadeLayout';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { LoadingNotice } from '@/components/ui/loading-notice';
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
  const exportIntegrityError = React.useMemo(() => {
    if (!prioridadeData) return null;

    const rows = prioridadeData.entregadores;
    const total = Number(prioridadeData.total);
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total !== rows.length) {
      return 'A lista recebida está incompleta. Tente carregar os dados novamente antes de exportar.';
    }

    const ids = new Set<string>();
    for (const row of rows) {
      const id = String(row.id_entregador || '').trim();
      if (!id || ids.has(id)) {
        return 'A lista contém entregadores sem identificador ou repetidos. Tente carregar os dados novamente antes de exportar.';
      }
      ids.add(id);
    }

    return null;
  }, [prioridadeData]);

  const showInitialLoading = state.loading && (!state.entregadoresData || state.entregadoresData.entregadores.length === 0);
  const showError = (!state.entregadoresData || (error && state.entregadoresData.entregadores.length === 0));
  const showIntegrityError = Boolean(exportIntegrityError && !loading);
  const showEmpty = !showInitialLoading && !showError && !showIntegrityError && state.entregadoresData?.entregadores.length === 0;

  const viewStateKey = showInitialLoading
    ? 'prioridade-loading'
    : showError
      ? 'prioridade-error'
      : showIntegrityError
        ? 'prioridade-integrity-error'
        : showEmpty
          ? 'prioridade-empty'
          : 'prioridade-content';

  return (
    <ViewTransition stateKey={viewStateKey} className="w-full" preventExitInteraction>
      {showInitialLoading ? (
        <DashboardSkeleton contentOnly />
      ) : showError ? (
        <PrioridadeErrorState onRetry={retry} />
      ) : showIntegrityError ? (
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
          <div role="alert" className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/85 px-5 py-4 text-sm font-semibold text-amber-800 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
            <span>{exportIntegrityError}</span>
            <button type="button" onClick={retry} className="shrink-0 font-bold underline underline-offset-4">Tentar novamente</button>
          </div>
        </div>
      ) : showEmpty ? (
        <PrioridadeEmptyState />
      ) : (
        <>
          {(error || state.loading) ? (
            <div className="mx-auto w-full max-w-[1600px] space-y-3 px-4 pt-4 sm:px-6 lg:px-8">
              {error ? (
                <div role="alert" className="rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
                  Não foi possível atualizar a Prioridade. Exibindo a resposta válida anterior.
                </div>
              ) : null}
              {state.loading ? (
                <LoadingNotice
                  tone="blue"
                  message="Atualizando prioridade com os filtros atuais"
                  detail="Os dados anteriores continuam visíveis enquanto a lista é atualizada."
                />
              ) : null}
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
            exportDisabled={loading || Boolean(error) || state.isSearching || Boolean(exportIntegrityError)}
            exportDisabledReason={exportIntegrityError || undefined}
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
        </>
      )}
    </ViewTransition>
  );
});

PrioridadePromoView.displayName = 'PrioridadePromoView';

export default PrioridadePromoView;
