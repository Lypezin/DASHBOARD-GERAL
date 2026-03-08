'use client';

import React from 'react';
import { EntregadoresData } from '@/types';
import { EntregadoresMainStatsCards } from './entregadores/EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './entregadores/EntregadoresMainSearch';
import { EntregadoresMainTable } from './entregadores/EntregadoresMainTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEntregadoresMainSort } from './entregadores/hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './entregadores/hooks/useEntregadoresMainStats';
import { EntregadoresEmptyState } from './entregadores/EntregadoresEmptyState';
import { TopBottomPerformers } from './entregadores/TopBottomPerformers';
import { EntregadorProfileDialog } from './entregadores/EntregadorProfileDialog';
import { EntregadoresHeader } from './entregadores/EntregadoresHeader';
import { useEntregadoresExport } from './entregadores/hooks/useEntregadoresExport';
import { useEntregadorProfile } from './entregadores/hooks/useEntregadorProfile';
import { formatarHorasParaHMS } from '@/utils/formatters';

const EntregadoresMainView = React.memo(function EntregadoresMainView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
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

  if (loading) return <DashboardSkeleton contentOnly />;

  if (!entregadoresData?.entregadores?.length) {
    return <EntregadoresEmptyState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EntregadoresHeader
        onExport={handleExport}
        isExporting={isExporting}
      />

      <EntregadoresMainStatsCards
        totalEntregadores={stats.totalEntregadores}
        aderenciaMedia={stats.aderenciaMedia}
        rejeicaoMedia={stats.rejeicaoMedia}
        totalCorridas={stats.totalCorridasCompletadas}
        totalHoras={formatarHorasParaHMS(stats.totalSegundos / 3600)}
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

      <TopBottomPerformers entregadores={sortedEntregadores} />

      <EntregadorProfileDialog
        entregador={selectedEntregador}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
