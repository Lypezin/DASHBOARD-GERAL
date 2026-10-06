'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { EntregadoresMainStatsCards } from './EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './EntregadoresMainSearch';
import { EntregadoresMainTable } from './EntregadoresMainTable';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { useEntregadoresMainSort } from './hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './hooks/useEntregadoresMainStats';
import { EntregadoresHeader } from './EntregadoresHeader';
import { useEntregadoresExport } from './hooks/useEntregadoresExport';
import { useEntregadorProfile } from './hooks/useEntregadorProfile';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import { ViewTransition } from '@/components/ui/view-transition';
import { AlertTriangle } from 'lucide-react';
import type { Entregador, EntregadoresData, EntregadoresSortField } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { resolveEntregadoresDescription } from './utils/entregadoresHelpers';
import { fetchEntregadoresData } from '@/utils/tabData/fetchers/entregadoresFetcher';
import { filterAndSortEntregadores } from './hooks/useEntregadoresMainSort';
import { EntregadoresLoading, FilteredDataTransition, FilterRefreshIndicator } from '@/components/dashboard/OperationalLoading';

function TopBottomPerformersSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <section
      role="status"
      aria-label="Carregando destaques da frota"
      aria-busy="true"
      className="space-y-4 rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((column) => (
          <div key={column} className="space-y-3 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800/70">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
            {Array.from({ length: rows }, (_, row) => (
              <div key={row} className="h-10 animate-pulse rounded-lg bg-slate-50 motion-reduce:animate-none dark:bg-slate-900" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando destaques da frota</span>
    </section>
  );
}

const DeferredTopBottomPerformers = dynamic(
  () => import('./TopBottomPerformers').then((mod) => ({ default: mod.TopBottomPerformers })),
  { ssr: false, loading: () => <TopBottomPerformersSkeleton /> }
);

const DeferredEntregadorProfileDialog = dynamic(
  () => import('./EntregadorProfileDialog').then((mod) => ({ default: mod.EntregadorProfileDialog })),
  { ssr: false }
);

interface EntregadoresMainContentProps {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRefreshing?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  variant?: 'entregadores' | 'dedicado';
  filterPayload?: FilterPayload;
  requestScopeKey?: string;
  serverPage?: {
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  onServerViewChange?: (view: {
    sortField: EntregadoresSortField;
    sortDirection: 'asc' | 'desc';
    showInactiveOnly: boolean;
  }) => void;
}

export const EntregadoresMainContent = React.memo(function EntregadoresMainContent({
  entregadoresData,
  loading,
  error = null,
  onRetry,
  isRefreshing = false,
  searchTerm = '',
  onSearchChange,
  variant = 'entregadores',
  filterPayload,
  requestScopeKey,
  serverPage,
  onServerViewChange,
}: EntregadoresMainContentProps) {
  const isDedicado = variant === 'dedicado';
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
  const handleSearchChange = React.useCallback((term: string) => {
    if (!onSearchChange) {
      setLocalSearchTerm(term);
    }

    onSearchChange?.(term);
  }, [onSearchChange]);
  
  const {
    sortedEntregadores,
    sortField,
    sortDirection,
    showInactiveOnly,
    setShowInactiveOnly,
    handleSort,
    isFilteringDeferred
  } = useEntregadoresMainSort(entregadoresData, effectiveSearchTerm, { serverSorted: Boolean(serverPage) });

  const organizationId = typeof filterPayload?.p_organization_id === 'string' ? filterPayload.p_organization_id : null;
  const exportFilters = React.useMemo(() => {
    const filters = { ...filterPayload };
    delete filters.p_limit;
    delete filters.p_page;
    delete filters.p_sort_field;
    delete filters.p_sort_direction;
    delete filters.p_only_inactive;
    filters.p_search = effectiveSearchTerm.trim() || null;
    if (!isDedicado) filters.p_only_inactive = showInactiveOnly;
    return filters;
  }, [effectiveSearchTerm, filterPayload, isDedicado, showInactiveOnly]);

  const loadCompleteRows = React.useCallback(async () => {
    if (isDedicado) return sortedEntregadores;

    const queryFilters = { ...exportFilters };
    const search = String(queryFilters.p_search || '').trim();
    queryFilters.p_search = search.length >= 3 ? search : null;
    const pageSize = 200;
    let pageNumber = 1;
    let reportedTotal: number | null = null;
    let responseFingerprint: string | null = null;
    const allRows: Entregador[] = [];
    const exportedIds = new Set<string>();

    while (reportedTotal === null || allRows.length < reportedTotal) {
      const result = await fetchEntregadoresData({
        filterPayload: {
          ...queryFilters,
          p_limit: pageSize,
          p_page: pageNumber,
          p_sort_field: String(sortField),
          p_sort_direction: sortDirection,
          p_only_inactive: !isDedicado && showInactiveOnly,
        } as FilterPayload,
      });
      if (result.error) {
        throw new Error(result.error.message || 'Não foi possível carregar todos os entregadores para o Excel.');
      }
      if (!result.data) {
        throw new Error('A busca paginada não retornou dados para a exportação.');
      }

      const pageTotal = Number(result.data.total);
      if (!Number.isSafeInteger(pageTotal) || pageTotal < 0) {
        throw new Error('A consulta retornou um total inválido para a exportação.');
      }
      const fingerprint = JSON.stringify([result.data.summary || null, result.data.performers_by_metric || null]);
      if (reportedTotal === null) {
        reportedTotal = pageTotal;
        responseFingerprint = fingerprint;
      } else if (pageTotal !== reportedTotal || fingerprint !== responseFingerprint) {
        throw new Error('Os dados mudaram durante a exportação. Gere o arquivo novamente.');
      }

      if (result.data.page !== pageNumber || result.data.page_size !== pageSize) {
        throw new Error('A paginação da exportação mudou durante a consulta. Gere o arquivo novamente.');
      }
      if (result.data.entregadores.length === 0 && allRows.length < reportedTotal) {
        throw new Error('A exportação encontrou uma página vazia antes do fim da lista. Atualize a consulta.');
      }

      for (const entregador of result.data.entregadores) {
        const id = String(entregador.id_entregador || '').trim();
        if (!id || exportedIds.has(id)) {
          throw new Error('A consulta retornou identificadores ausentes ou repetidos. Atualize a lista antes de exportar.');
        }
        exportedIds.add(id);
      }
      allRows.push(...result.data.entregadores);
      pageNumber += 1;
      if (pageNumber > 1000000) {
        throw new Error('A exportação ultrapassou o limite de páginas permitido.');
      }
    }

    if (reportedTotal === null || allRows.length !== reportedTotal) {
      throw new Error('A consulta retornou apenas parte dos entregadores. Atualize a lista antes de exportar.');
    }
    return filterAndSortEntregadores(
      allRows,
      effectiveSearchTerm,
      showInactiveOnly,
      sortField,
      sortDirection
    );
  }, [effectiveSearchTerm, exportFilters, isDedicado, showInactiveOnly, sortDirection, sortField, sortedEntregadores]);

  const { isExporting, handleExport } = useEntregadoresExport(
    sortedEntregadores,
    organizationId,
    exportFilters,
    { loadCompleteRows: isDedicado ? undefined : loadCompleteRows }
  );
  const { selectedEntregador, profileOpen, setProfileOpen, handleRowClick } = useEntregadorProfile();
  const stats = useEntregadoresMainStats(sortedEntregadores);
  const displayStats = !isDedicado && entregadoresData?.summary
    ? {
        totalEntregadores: entregadoresData.summary.total_entregadores,
        aderenciaMedia: entregadoresData.summary.aderencia_media,
        rejeicaoMedia: entregadoresData.summary.rejeicao_media,
        totalCorridasCompletadas: entregadoresData.summary.corridas_completadas,
        totalSegundos: entregadoresData.summary.total_segundos,
      }
    : stats;
  const hasEntregadores = (entregadoresData?.entregadores.length || 0) > 0;
  const pageResultIsStale = Boolean(
    serverPage
    && typeof entregadoresData?.page === 'number'
    && entregadoresData.page !== serverPage.currentPage
  );
  const isUpdatingResults = loading || isRefreshing || isFilteringDeferred || pageResultIsStale;
  const performerCount = Math.max(Number(displayStats.totalEntregadores) || 0, sortedEntregadores.length);
  const hasPerformers = performerCount >= 5;
  const showPerformers = useDeferredMount({
    enabled: isDedicado && hasPerformers,
    timeoutMs: 300,
  });
  const resolvedDescription = React.useMemo(() => {
    if (isDedicado) {
      return 'Performance dos entregadores nas origens do filtro atual';
    }

    return resolveEntregadoresDescription(
      filterPayload,
      entregadoresData?.periodo_resolvido,
      'Performance e aderência da frota'
    );
  }, [entregadoresData?.periodo_resolvido, filterPayload, isDedicado]);

  React.useEffect(() => {
    if (isDedicado || !onServerViewChange) return;
    onServerViewChange({ sortField, sortDirection, showInactiveOnly });
  }, [isDedicado, onServerViewChange, showInactiveOnly, sortDirection, sortField]);

  if (loading && !hasEntregadores) {
    return (
      <ViewTransition stateKey={`${variant}-loading`} preventExitInteraction={!isDedicado}>
        <EntregadoresLoading appearance={isDedicado ? 'default' : 'quiet'} />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey={`${variant}-content`} preventExitInteraction={!isDedicado}>
      <ViewContainer
        data-entregadores-design={isDedicado ? undefined : 'v4'}
        className={isDedicado ? 'space-y-5' : 'space-y-5'}
      >
        <EntregadoresHeader
          onExport={handleExport}
          isExporting={isExporting}
          disableExport={loading || Boolean(error) || isRefreshing || isFilteringDeferred}
          exportDisabledReason={error
            ? 'A atualização falhou; tente novamente antes de exportar.'
            : 'Aguarde a busca terminar para exportar os dados corretos.'}
          title={isDedicado ? 'Entregadores por Origem' : undefined}
          description={resolvedDescription}
          periodoResolvido={entregadoresData?.periodo_resolvido}
          variant={variant}
        />

        {error && !hasEntregadores ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Não foi possível carregar os entregadores.</p>
                <p className="mt-1 text-sm text-rose-800">Os indicadores não foram carregados. Tente novamente em instantes.</p>
              </div>
            </div>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-900 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        {error && hasEntregadores ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Não foi possível atualizar os entregadores.</p>
                <p className="mt-1 text-sm text-amber-900">Os dados da consulta anterior continuam visíveis. Tente atualizar novamente.</p>
              </div>
            </div>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        {error && !hasEntregadores ? null : (
          <FilteredDataTransition
            isUpdating={isUpdatingResults}
            className={isDedicado ? 'space-y-5' : 'space-y-4'}
          >
            <EntregadoresMainStatsCards
              variant={variant}
              totalEntregadores={displayStats.totalEntregadores}
              aderenciaMedia={displayStats.aderenciaMedia}
              rejeicaoMedia={displayStats.rejeicaoMedia}
              totalCorridas={displayStats.totalCorridasCompletadas}
              totalHoras={formatarHorasParaHMS(displayStats.totalSegundos / 3600)}
              totalTitle={isDedicado ? 'Total de Entregadores' : undefined}
              totalSubtext={isDedicado ? 'Entregadores nas origens do filtro' : undefined}
              corridasTitle={isDedicado ? 'Completadas' : undefined}
              corridasSubtext={isDedicado ? 'Total completado nas origens' : undefined}
            />

            <EntregadoresMainSearch
              variant={variant}
              searchTerm={effectiveSearchTerm}
              onSearchChange={handleSearchChange}
              showInactiveOnly={showInactiveOnly}
              onShowInactiveOnlyChange={setShowInactiveOnly}
              isSearching={isUpdatingResults}
            />

            <FilterRefreshIndicator
              isLoading={isUpdatingResults}
              viewName="a lista de entregadores"
              appearance={isDedicado ? 'default' : 'quiet'}
            />

            <EntregadoresMainTable
              variant={variant}
              sortedEntregadores={sortedEntregadores}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              searchTerm={effectiveSearchTerm}
              onRowClick={handleRowClick}
              isUpdating={isUpdatingResults}
              serverPagination={serverPage ? {
                ...serverPage,
                loadedPage: entregadoresData?.page,
                totalItems: entregadoresData?.total ?? 0,
              } : undefined}
            />

            {isDedicado && hasPerformers ? (
              showPerformers ? (
                <DeferredTopBottomPerformers
                  entregadores={sortedEntregadores}
                  totalEntregadores={displayStats.totalEntregadores}
                />
              ) : <TopBottomPerformersSkeleton rows={Math.min(10, Math.max(1, Math.floor(performerCount)))} />
            ) : null}

            {selectedEntregador ? (
              <DeferredEntregadorProfileDialog
                entregador={selectedEntregador}
                open={profileOpen}
                onOpenChange={setProfileOpen}
                organizationId={organizationId || undefined}
                variant={variant}
                filterPayload={filterPayload}
                requestScopeKey={requestScopeKey}
              />
            ) : null}
          </FilteredDataTransition>
        )}
      </ViewContainer>
    </ViewTransition>
  );
});

EntregadoresMainContent.displayName = 'EntregadoresMainContent';
