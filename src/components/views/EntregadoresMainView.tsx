'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { EntregadoresMainStatsCards } from './entregadores/EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './entregadores/EntregadoresMainSearch';
import { EntregadoresMainTable } from './entregadores/EntregadoresMainTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEntregadoresMainSort } from './entregadores/hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './entregadores/hooks/useEntregadoresMainStats';
import { EntregadoresHeader } from './entregadores/EntregadoresHeader';
import { useEntregadoresExport } from './entregadores/hooks/useEntregadoresExport';
import { useEntregadorProfile } from './entregadores/hooks/useEntregadorProfile';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import type { CurrentUser, EntregadoresData } from '@/types';
import type { FilterPayload } from '@/types/filters';

const DeferredTopBottomPerformers = dynamic(
  () => import('./entregadores/TopBottomPerformers').then((mod) => ({ default: mod.TopBottomPerformers })),
  { ssr: false }
);

const DeferredEntregadorProfileDialog = dynamic(
  () => import('./entregadores/EntregadorProfileDialog').then((mod) => ({ default: mod.EntregadorProfileDialog })),
  { ssr: false }
);

interface EntregadoresMainContentProps {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
  variant?: 'entregadores' | 'dedicado';
  filterPayload?: FilterPayload;
}

export const EntregadoresMainContent = React.memo(function EntregadoresMainContent({
  entregadoresData,
  loading,
  variant = 'entregadores',
  filterPayload,
}: EntregadoresMainContentProps) {
  const isDedicado = variant === 'dedicado';
  const {
    sortedEntregadores,
    sortField,
    sortDirection,
    searchTerm,
    setSearchTerm,
    showInactiveOnly,
    setShowInactiveOnly,
    handleSort
  } = useEntregadoresMainSort(entregadoresData);

  const { isExporting, handleExport } = useEntregadoresExport(sortedEntregadores);
  const { selectedEntregador, profileOpen, setProfileOpen, handleRowClick } = useEntregadorProfile();
  const stats = useEntregadoresMainStats(sortedEntregadores);
  const showPerformers = useDeferredMount({
    enabled: sortedEntregadores.length > 0,
    timeoutMs: 800,
  });

  if (loading) return <DashboardSkeleton contentOnly />;

  return (
    <div className="space-y-6 animate-fade-in">
      <EntregadoresHeader
        onExport={handleExport}
        isExporting={isExporting}
        title={isDedicado ? 'Entregadores por Origem' : undefined}
        description={isDedicado ? 'Performance dos entregadores nas origens do filtro atual' : undefined}
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showInactiveOnly={showInactiveOnly}
        onShowInactiveOnlyChange={setShowInactiveOnly}
      />

      <EntregadoresMainTable
        sortedEntregadores={sortedEntregadores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchTerm={searchTerm}
        onRowClick={handleRowClick}
      />

      {showPerformers ? <DeferredTopBottomPerformers entregadores={sortedEntregadores} /> : null}

      {selectedEntregador ? (
        <DeferredEntregadorProfileDialog
          entregador={selectedEntregador}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          organizationId={typeof filterPayload?.p_organization_id === 'string' ? filterPayload.p_organization_id : undefined}
          variant={variant}
          filterPayload={filterPayload}
        />
      ) : null}
    </div>
  );
});

EntregadoresMainContent.displayName = 'EntregadoresMainContent';

const EntregadoresMainView = React.memo(function EntregadoresMainView({
  filterPayload,
  currentUser,
  variant = 'entregadores',
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
  variant?: 'entregadores' | 'dedicado';
}) {
  const isDedicado = variant === 'dedicado';
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get('ent_search')?.trim() || '';
  const [serverSearch, setServerSearch] = React.useState(searchFromUrl);
  const normalizedSearchFromUrl = searchFromUrl.trim();
  const normalizedServerSearch = serverSearch.trim();
  const isSearchSyncing = !isDedicado
    && normalizedSearchFromUrl !== normalizedServerSearch
    && (normalizedSearchFromUrl.length >= 3 || normalizedServerSearch.length >= 3);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setServerSearch(searchFromUrl);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchFromUrl]);

  const dedicatedPayload = React.useMemo<FilterPayload>(() => {
    if (!isDedicado) {
      const search = normalizedServerSearch;
      if (search.length < 3) return filterPayload;

      return {
        ...filterPayload,
        p_search: search,
      };
    }

    return {
      ...filterPayload,
    };
  }, [filterPayload, isDedicado, normalizedServerSearch]);
  const activeTab = isDedicado ? 'dedicado' : 'entregadores';
  const { data: tabData, loading } = useTabData(activeTab, dedicatedPayload, currentUser);
  const { entregadoresData } = useTabDataMapper({ activeTab, tabData });

  return (
    <EntregadoresMainContent
      entregadoresData={entregadoresData}
      loading={loading || isSearchSyncing}
      variant={variant}
      filterPayload={dedicatedPayload}
    />
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
