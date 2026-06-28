'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { EntregadoresMainStatsCards } from './EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './EntregadoresMainSearch';
import { EntregadoresMainTable } from './EntregadoresMainTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { useEntregadoresMainSort } from './hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './hooks/useEntregadoresMainStats';
import { EntregadoresHeader } from './EntregadoresHeader';
import { useEntregadoresExport } from './hooks/useEntregadoresExport';
import { useEntregadorProfile } from './hooks/useEntregadorProfile';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import { ViewTransition } from '@/components/ui/view-transition';
import { LoadingNotice } from '@/components/ui/loading-notice';
import type { EntregadoresData } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { resolveEntregadoresDescription } from './utils/entregadoresHelpers';

const DeferredTopBottomPerformers = dynamic(
  () => import('./TopBottomPerformers').then((mod) => ({ default: mod.TopBottomPerformers })),
  { ssr: false }
);

const DeferredEntregadorProfileDialog = dynamic(
  () => import('./EntregadorProfileDialog').then((mod) => ({ default: mod.EntregadorProfileDialog })),
  { ssr: false }
);

interface EntregadoresMainContentProps {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
  isRefreshing?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  variant?: 'entregadores' | 'dedicado';
  filterPayload?: FilterPayload;
}

export const EntregadoresMainContent = React.memo(function EntregadoresMainContent({
  entregadoresData,
  loading,
  isRefreshing = false,
  searchTerm = '',
  onSearchChange,
  variant = 'entregadores',
  filterPayload,
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
  } = useEntregadoresMainSort(entregadoresData, effectiveSearchTerm);

  const organizationId = typeof filterPayload?.p_organization_id === 'string' ? filterPayload.p_organization_id : null;
  const { isExporting, handleExport } = useEntregadoresExport(sortedEntregadores, organizationId);
  const { selectedEntregador, profileOpen, setProfileOpen, handleRowClick } = useEntregadorProfile();
  const stats = useEntregadoresMainStats(sortedEntregadores);
  const showPerformers = useDeferredMount({
    enabled: sortedEntregadores.length > 0,
    timeoutMs: 800,
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

  if (loading && !entregadoresData) {
    return (
      <ViewTransition stateKey={`${variant}-loading`}>
        <DashboardSkeleton contentOnly />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey={`${variant}-content`}>
      <ViewContainer className="space-y-6">
        <EntregadoresHeader
          onExport={handleExport}
          isExporting={isExporting}
          disableExport={loading || isRefreshing}
          exportDisabledReason="Aguarde a busca terminar para exportar os dados corretos."
          title={isDedicado ? 'Entregadores por Origem' : undefined}
          description={resolvedDescription}
          periodoResolvido={entregadoresData?.periodo_resolvido}
        />

        <EntregadoresMainStatsCards
          totalEntregadores={stats.totalEntregadores}
          aderenciaMedia={stats.aderenciaMedia}
          rejeicaoMedia={stats.rejeicaoMedia}
          totalCorridas={stats.totalCorridasCompletadas}
          totalHoras={formatarHorasParaHMS(stats.totalSegundos / 3600)}
          totalTitle={isDedicado ? 'Total de Entregadores' : undefined}
          totalSubtext={isDedicado ? 'Entregadores nas origens do filtro' : undefined}
          corridasTitle={isDedicado ? 'Completadas' : undefined}
          corridasSubtext={isDedicado ? 'Total completado nas origens' : undefined}
        />

        <EntregadoresMainSearch
          searchTerm={effectiveSearchTerm}
          onSearchChange={handleSearchChange}
          showInactiveOnly={showInactiveOnly}
          onShowInactiveOnlyChange={setShowInactiveOnly}
          isSearching={loading || isRefreshing || isFilteringDeferred}
        />

        {loading || isRefreshing || isFilteringDeferred ? (
          <LoadingNotice
            tone={loading || isRefreshing ? 'emerald' : 'sky'}
            message={loading || isRefreshing ? 'Atualizando entregadores com os filtros atuais' : 'Aplicando busca e ordenacao sem travar a tela'}
            detail={loading || isRefreshing ? 'Os dados anteriores continuam visiveis durante a atualizacao.' : 'A lista responde primeiro e finaliza o processamento em segundo plano.'}
          />
        ) : null}

        <EntregadoresMainTable
          sortedEntregadores={sortedEntregadores}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchTerm={effectiveSearchTerm}
          onRowClick={handleRowClick}
        />

        {showPerformers ? <DeferredTopBottomPerformers entregadores={sortedEntregadores} /> : null}

        {selectedEntregador ? (
          <DeferredEntregadorProfileDialog
            entregador={selectedEntregador}
            open={profileOpen}
            onOpenChange={setProfileOpen}
            organizationId={organizationId || undefined}
            variant={variant}
            filterPayload={filterPayload}
          />
        ) : null}
      </ViewContainer>
    </ViewTransition>
  );
});

EntregadoresMainContent.displayName = 'EntregadoresMainContent';
