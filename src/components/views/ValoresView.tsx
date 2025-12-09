'use client';

import React, { useState, useCallback } from 'react';
import { ValoresEntregador } from '@/types';
import { AlertCircle, DollarSign, Download } from 'lucide-react';
import { ValoresStatsCards } from './valores/ValoresStatsCards';
import { ValoresTable } from './valores/ValoresTable';
import { ValoresSearch } from './valores/ValoresSearch';
import { useValoresData } from './valores/useValoresData';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Button } from '@/components/ui/button';
import { exportarValoresParaExcel } from './valores/ValoresExcelExport';
import { safeLog } from '@/lib/errorHandler';

const ValoresView = React.memo(function ValoresView({
  valoresData,
  loading,
}: {
  valoresData: ValoresEntregador[];
  loading: boolean;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const {
    sortedValores,
    sortField,
    sortDirection,
    searchTerm,
    isSearching,
    error,
    totalGeral,
    totalCorridas,
    taxaMediaGeral,
    totalEntregadores,
    setSearchTerm,
    handleSort,
    formatarReal
  } = useValoresData(valoresData, loading);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportarValoresParaExcel(sortedValores);
    } catch (err) {
      safeLog.error('Erro export valores', err);
    } finally {
      setIsExporting(false);
    }
  }, [sortedValores]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!valoresData || !Array.isArray(valoresData) || valoresData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <DollarSign className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum valor encontrado</p>
        <p className="text-sm text-slate-500">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Valores por Entregador
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o repasse de cada entregador
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

      <ValoresSearch
        searchTerm={searchTerm}
        isSearching={isSearching}
        totalResults={totalEntregadores}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
      />

      <ValoresStatsCards
        totalGeral={totalGeral}
        totalEntregadores={totalEntregadores}
        totalCorridas={totalCorridas}
        taxaMediaGeral={taxaMediaGeral}
        formatarReal={formatarReal}
      />

      <ValoresTable
        sortedValores={sortedValores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        formatarReal={formatarReal}
      />
    </div>
  );
});

ValoresView.displayName = 'ValoresView';

export default ValoresView;
