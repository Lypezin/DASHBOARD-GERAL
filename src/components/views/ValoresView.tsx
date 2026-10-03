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
import { fetchValoresData } from '@/utils/tabData/fetchers/valoresFetcher';
import { filterAndSortValores } from '@/utils/valores/filterAndSortValores';

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
    setSearchTerm, handleSort, formatarReal, hasResolvedData, loading, retry
  } = useValoresData(valoresPayload, currentUser);
  const exportDisabled = loading || isSearching || Boolean(error) || !hasResolvedData;

  const handleExport = useCallback(async () => {
    if (isExporting || exportDisabled) return;
    try {
      setIsExporting(true);
      const result = await fetchValoresData({ filterPayload: valoresPayload });
      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'A consulta completa de valores não retornou dados.');
      }

      const exportRows = filterAndSortValores(result.data, { searchTerm, sortField, sortDirection });
      await exportarValoresParaExcel(exportRows, { ...filterPayload, p_search: searchTerm || null });
    }
    catch (err) {
      safeLog.error('Erro export valores', err);
      const message = err instanceof Error ? err.message : '';
      toast.error(message.startsWith('RETRY_') ? 'A consulta demorou mais que o esperado. Tente exportar novamente.' : message || 'Não foi possível gerar o Excel de valores.');
    }
    finally { setIsExporting(false); }
  }, [exportDisabled, filterPayload, isExporting, searchTerm, sortDirection, sortField, valoresPayload]);

  if (loading && !hasResolvedData) {
    return (
      <ViewTransition stateKey="valores-loading">
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  if (error && !hasResolvedData) {
    return (
      <ViewTransition stateKey="valores-error">
        <ValoresError error={error} onRetry={retry} />
      </ViewTransition>
    );
  }

  if (!hasResolvedData) {
    return (
      <ViewTransition stateKey="valores-loading">
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey="valores-content">
      <ViewContainer className="space-y-6 pb-10">
        {loading ? (
          <LoadingNotice
            tone="blue"
            message="Atualizando valores com os filtros atuais"
            detail="Mantendo os cards e a tabela anteriores enquanto o novo lote e preparado."
          />
        ) : null}

        {error && hasResolvedData ? (
          <div role="alert" className="rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
            Não foi possível atualizar os valores. Exibindo a resposta válida anterior.
            <button type="button" onClick={retry} className="ml-3 underline underline-offset-2">Tentar novamente</button>
          </div>
        ) : null}

        {isSearching ? (
          <LoadingNotice
            tone="sky"
            message="Aplicando busca e ordenacao sem travar a tela"
            detail="A lista e refinada de forma gradual para evitar travamentos em bases grandes."
          />
        ) : null}
        <div>
          <ValoresStatsCards totalGeral={totalGeral} totalEntregadores={totalEntregadores} totalCorridas={totalCorridas} taxaMediaGeral={taxaMediaGeral} formatarReal={formatarReal} />
        </div>

        <div className="space-y-4">
          <ValoresHeader isExporting={isExporting} exportDisabled={exportDisabled} onExport={handleExport} />

          <div>
            <ValoresSearch searchTerm={searchTerm} isSearching={isSearching} totalResults={totalEntregadores} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm('')} />
          </div>

          <div>
            <ValoresTable sortedValores={paginatedValores} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} formatarReal={formatarReal} isDetailed={false} onLoadMore={loadMore} hasMore={hasMore} isLoadingMore={isLoadingMore} />
          </div>
        </div>
      </ViewContainer>
    </ViewTransition>
  );
});

ValoresView.displayName = 'ValoresView';
export default ValoresView;
