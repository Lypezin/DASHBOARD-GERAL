'use client';
import React, { useState, useCallback } from 'react';
import { ValoresStatsCards } from './valores/ValoresStatsCards';
import { ValoresTable } from './valores/ValoresTable';
import { ValoresSearch } from './valores/ValoresSearch';
import { useValoresData } from './valores/useValoresData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { exportarValoresParaExcel } from './valores/ValoresExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { toast } from 'sonner';
import { ValoresHeader } from './valores/ValoresHeader';
import { ValoresError } from './valores/ValoresStates';

import { ViewTransition } from '@/components/ui/view-transition';
import { LoadingNotice } from '@/components/ui/loading-notice';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { ViewContainer } from '@/components/layout/ViewContainer';

const ValoresView = React.memo(function ValoresView({ 
  filterPayload, 
  currentUser 
}: { 
  filters: any; 
  setFilters: any; 
  filterPayload: FilterPayload; 
  currentUser: CurrentUser | null; 
}) {
  const valoresPayload = React.useMemo(() => ({ ...filterPayload, detailed: false }), [filterPayload]);
  const [isExporting, setIsExporting] = useState(false);

  const {
    paginatedValores, sortField, sortDirection, searchTerm, isSearching, error,
    totalGeral, totalCorridas, taxaMediaGeral, totalEntregadores, loadMore, hasMore, isLoadingMore,
    setSearchTerm, handleSort, formatarReal, hasResolvedData, loading, retry, loadAllRows
  } = useValoresData(valoresPayload, currentUser);
  const exportDisabled = loading || isSearching || Boolean(error) || !hasResolvedData;

  const handleExport = useCallback(async () => {
    if (isExporting || exportDisabled) return;
    try {
      setIsExporting(true);
      const exportRows = await loadAllRows();
      await exportarValoresParaExcel(exportRows, {
        ...filterPayload,
        p_search: searchTerm.trim() || null,
        p_sort_field: String(sortField),
        p_sort_direction: sortDirection,
      });
    }
    catch (err) {
      safeLog.error('Erro export valores', err);
      const message = err instanceof Error ? err.message : '';
      toast.error(message.startsWith('RETRY_') ? 'A consulta demorou mais que o esperado. Tente exportar novamente.' : message || 'Não foi possível gerar o Excel de valores.');
    }
    finally { setIsExporting(false); }
  }, [exportDisabled, filterPayload, isExporting, loadAllRows, searchTerm, sortDirection, sortField]);

  if (loading && !hasResolvedData) {
    return (
      <ViewTransition stateKey="valores-loading" preventExitInteraction>
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  if (error && !hasResolvedData) {
    return (
      <ViewTransition stateKey="valores-error" preventExitInteraction>
        <ValoresError error={error} onRetry={retry} />
      </ViewTransition>
    );
  }

  if (!hasResolvedData) {
    return (
      <ViewTransition stateKey="valores-loading" preventExitInteraction>
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey="valores-content" preventExitInteraction>
      <ViewContainer className="space-y-4 pb-10">
        {loading ? (
          <LoadingNotice
            tone="blue"
            message="Atualizando valores com os filtros atuais"
            detail="Os dados anteriores continuam visíveis enquanto a consulta é atualizada."
          />
        ) : null}

        {error && hasResolvedData ? (
          <div role="alert" className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
            Não foi possível atualizar os valores. Exibindo a resposta válida anterior.
            <button type="button" onClick={retry} className="w-fit font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40">Tentar novamente</button>
          </div>
        ) : null}

        {isSearching ? (
          <LoadingNotice
            tone="sky"
            message="Atualizando resultados da busca"
            detail="A lista permanece visível enquanto os resultados são refinados."
          />
        ) : null}

        <ValoresHeader isExporting={isExporting} exportDisabled={exportDisabled} onExport={handleExport} />

        <ValoresStatsCards totalGeral={totalGeral} totalEntregadores={totalEntregadores} totalCorridas={totalCorridas} taxaMediaGeral={taxaMediaGeral} formatarReal={formatarReal} />

        <section aria-labelledby="valores-detalhamento-title" className="overflow-hidden rounded-xl border border-[#d3e0e9] bg-white shadow-[0_12px_36px_-28px_rgba(14,55,82,0.45)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-[#e2ebf0] px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 id="valores-detalhamento-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
                Detalhamento por entregador
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Clique nos títulos das colunas para ordenar.
              </p>
            </div>
            <ValoresSearch searchTerm={searchTerm} isSearching={isSearching} totalResults={totalEntregadores} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm('')} />
          </div>

          <ValoresTable sortedValores={paginatedValores} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} formatarReal={formatarReal} isDetailed={false} isUpdating={loading && paginatedValores.length === 0} onLoadMore={loadMore} hasMore={hasMore} isLoadingMore={isLoadingMore} searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
        </section>
      </ViewContainer>
    </ViewTransition>
  );
});

ValoresView.displayName = 'ValoresView';
export default ValoresView;
