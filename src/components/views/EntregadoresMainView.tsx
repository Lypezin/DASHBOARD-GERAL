'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { EntregadoresMainStatsCards } from './entregadores/EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './entregadores/EntregadoresMainSearch';
import { EntregadoresMainTable } from './entregadores/EntregadoresMainTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEntregadoresMainSort } from './entregadores/hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './entregadores/hooks/useEntregadoresMainStats';
import { EntregadoresEmptyState } from './entregadores/EntregadoresEmptyState';
import { EntregadoresHeader } from './entregadores/EntregadoresHeader';
import { useEntregadoresExport } from './entregadores/hooks/useEntregadoresExport';
import { useEntregadorProfile } from './entregadores/hooks/useEntregadorProfile';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

const DeferredTopBottomPerformers = dynamic(
  () => import('./entregadores/TopBottomPerformers').then((mod) => ({ default: mod.TopBottomPerformers })),
  { ssr: false }
);

const DeferredEntregadorProfileDialog = dynamic(
  () => import('./entregadores/EntregadorProfileDialog').then((mod) => ({ default: mod.EntregadorProfileDialog })),
  { ssr: false }
);

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
  const dedicatedPayload = React.useMemo<FilterPayload>(() => {
    if (!isDedicado) return filterPayload;

    return {
      ...filterPayload,
      p_origem: null,
      p_origens: null,
      p_only_dedicados: true,
    };
  }, [filterPayload, isDedicado]);
  const activeTab = isDedicado ? 'dedicado' : 'entregadores';
  const { data: tabData, loading } = useTabData(activeTab, dedicatedPayload, currentUser);
  const { entregadoresData } = useTabDataMapper({ activeTab, tabData });
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

  if (!entregadoresData?.entregadores?.length) {
    return <EntregadoresEmptyState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EntregadoresHeader
        onExport={handleExport}
        isExporting={isExporting}
        title={isDedicado ? 'Dedicados' : undefined}
        description={isDedicado ? 'Performance dos entregadores em origens de frota dedicada' : undefined}
        periodoResolvido={entregadoresData.periodo_resolvido}
      />

      <EntregadoresMainStatsCards
        totalEntregadores={stats.totalEntregadores}
        aderenciaMedia={stats.aderenciaMedia}
        rejeicaoMedia={stats.rejeicaoMedia}
        totalCorridas={stats.totalCorridasCompletadas}
        totalHoras={formatarHorasParaHMS(stats.totalSegundos / 3600)}
        totalTitle={isDedicado ? 'Total de Dedicados' : undefined}
        totalSubtext={isDedicado ? 'Entregadores com origem dedicada' : undefined}
        corridasTitle={isDedicado ? 'Completadas Dedicado' : undefined}
        corridasSubtext={isDedicado ? 'Total completado em dedicados' : undefined}
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
        />
      ) : null}
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
