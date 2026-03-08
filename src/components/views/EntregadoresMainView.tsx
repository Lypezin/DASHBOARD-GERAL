'use client';

import React, { useState, useCallback } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { Users, Download } from 'lucide-react';
import { EntregadoresMainStatsCards } from './entregadores/EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './entregadores/EntregadoresMainSearch';
import { EntregadoresMainTable } from './entregadores/EntregadoresMainTable';
import { Button } from '@/components/ui/button';
import { exportarEntregadoresMainParaExcel } from './entregadores/EntregadoresMainExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEntregadoresMainSort } from './entregadores/hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './entregadores/hooks/useEntregadoresMainStats';
import { EntregadoresEmptyState } from './entregadores/EntregadoresEmptyState';
import { TopBottomPerformers } from './entregadores/TopBottomPerformers';
import { EntregadorProfileDialog } from './entregadores/EntregadorProfileDialog';

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

  const [isExporting, setIsExporting] = useState(false);
  const [selectedEntregador, setSelectedEntregador] = useState<Entregador | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleRowClick = useCallback((entregador: Entregador) => {
    setSelectedEntregador(entregador);
    setProfileOpen(true);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportarEntregadoresMainParaExcel(sortedEntregadores);
    } catch (error) {
      safeLog.error('Erro export main', error);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = useEntregadoresMainStats(sortedEntregadores);

  if (loading) {
    return <DashboardSkeleton contentOnly />;
  }

  if (!entregadoresData || !entregadoresData.entregadores || entregadoresData.entregadores.length === 0) {
    return <EntregadoresEmptyState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Entregadores Operacional
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Performance e aderência da frota
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </div>

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
