'use client';

import React, { useState } from 'react';
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
    handleSort
  } = useEntregadoresMainSort(entregadoresData);

  const [isExporting, setIsExporting] = useState(false);

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

  // Calcular estatísticas antes dos early returns
  const totalEntregadores = sortedEntregadores.length;
  const aderenciaMedia = totalEntregadores > 0
    ? sortedEntregadores.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores
    : 0;
  const rejeicaoMedia = totalEntregadores > 0
    ? sortedEntregadores.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores
    : 0;

  if (loading) {
    return <DashboardSkeleton contentOnly />;
  }

  if (!entregadoresData || !entregadoresData.entregadores || entregadoresData.entregadores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Users className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum entregador encontrado</p>
        <p className="text-sm text-slate-500">Tente ajustar os filtros para ver mais resultados.</p>
      </div>
    );
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
        totalEntregadores={totalEntregadores}
        aderenciaMedia={aderenciaMedia}
        rejeicaoMedia={rejeicaoMedia}
        totalCorridas={entregadoresData.total || 0}
      />

      <EntregadoresMainSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <EntregadoresMainTable
        sortedEntregadores={sortedEntregadores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchTerm={searchTerm}
      />
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
