'use client';
import React, { useState, useCallback } from 'react';
import { ValoresEntregador } from '@/types';
import { ValoresStatsCards } from './valores/ValoresStatsCards';
import { ValoresTable } from './valores/ValoresTable';
import { ValoresSearch } from './valores/ValoresSearch';
import { useValoresData } from './valores/useValoresData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { exportarValoresParaExcel } from './valores/ValoresExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { ValoresHeader } from './valores/ValoresHeader';
import { ValoresError, ValoresEmpty } from './valores/ValoresStates';

import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { ViewTransition } from '@/components/ui/view-transition';
import { LoadingNotice } from '@/components/ui/loading-notice';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { ViewContainer } from '@/components/layout/ViewContainer';

const ValoresView = React.memo(function ValoresView({ 
  filters, 
  filterPayload, 
  currentUser 
}: { 
  filters: any; 
  setFilters: any; 
  filterPayload: FilterPayload; 
  currentUser: CurrentUser | null; 
}) {
  const valoresPayload = React.useMemo(() => ({ ...filterPayload, detailed: false }), [filterPayload]);
  const { data: tabData, loading, error: loadError } = useTabData('valores', valoresPayload, currentUser);
  const { valoresData } = useTabDataMapper({ activeTab: 'valores', tabData });
  const [isExporting, setIsExporting] = useState(false);
  const filtrosSemDetalhamento = React.useMemo(() => ({ ...filters, detailed: false }), [filters]);

  const {
    sortedValores, paginatedValores, sortField, sortDirection, searchTerm, isSearching, error: localError,
    totalGeral, totalCorridas, taxaMediaGeral, totalEntregadores, loadMore, hasMore, isLoadingMore,
    setSearchTerm, handleSort, formatarReal
  } = useValoresData(valoresData, loading, filtrosSemDetalhamento);
  const error = loadError || localError;

  const hasValoresData = Array.isArray(valoresData) && valoresData.length > 0;

  const handleExport = useCallback(async () => {
    try { setIsExporting(true); await exportarValoresParaExcel(sortedValores); }
    catch (err) { safeLog.error('Erro export valores', err); }
    finally { setIsExporting(false); }
  }, [sortedValores]);

  if (loading && !hasValoresData) {
    return (
      <ViewTransition stateKey="valores-loading">
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  if (error && !hasValoresData) {
    return (
      <ViewTransition stateKey="valores-error">
        <ValoresError error={error} />
      </ViewTransition>
    );
  }

  if (!loading && Array.isArray(valoresData) && valoresData.length === 0) {
    return (
      <ViewTransition stateKey="valores-empty">
        <ValoresEmpty />
      </ViewTransition>
    );
  }

  if (!valoresData || !Array.isArray(valoresData)) {
    if (!loading) {
      return (
        <ViewTransition stateKey="valores-empty">
          <ValoresEmpty />
        </ViewTransition>
      );
    }

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
          <ValoresHeader isExporting={isExporting} onExport={handleExport} />

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
