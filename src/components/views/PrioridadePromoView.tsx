import React from 'react';
import { EntregadoresData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrioridadeFilters } from './prioridade/PrioridadeFilters';
import { PrioridadeSearch } from './prioridade/PrioridadeSearch';
import { PrioridadeTable } from './prioridade/PrioridadeTable';
import { PrioridadeStatsCards } from './prioridade/PrioridadeStatsCards';
import { usePrioridadeData } from './prioridade/usePrioridadeData';
import { usePrioridadeStats } from './prioridade/hooks/usePrioridadeStats';
import { PrioridadeEmptyState, PrioridadeErrorState } from './prioridade/components/PrioridadeEmptyStates';
import { exportarPrioridadeParaExcel } from './prioridade/PrioridadeExcelExport';
import { safeLog } from '@/lib/errorHandler';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  calcularPercentualAceitas,
  calcularPercentualCompletadas,
  getAderenciaColor,
  getAderenciaBg,
  getRejeicaoColor,
  getRejeicaoBg,
  getAceitasColor,
  getAceitasBg,
  getCompletadasColor,
  getCompletadasBg,
} from './prioridade/PrioridadeUtils';
import { Download } from 'lucide-react';

const PrioridadePromoView = React.memo(function PrioridadePromoView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const {
    sortedEntregadores,
    dataFiltrada,
    sortField,
    sortDirection,
    searchTerm,
    isSearching,
    filtroAderencia,
    filtroRejeicao,
    filtroCompletadas,
    filtroAceitas,
    setSearchTerm,
    setFiltroAderencia,
    setFiltroRejeicao,
    setFiltroCompletadas,
    setFiltroAceitas,
    handleSort,
    handleClearFilters
  } = usePrioridadeData(entregadoresData);

  // Calcular estatísticas
  const {
    totalOfertadas,
    totalAceitas,
    totalRejeitadas,
    totalCompletadas,
    totalEntregadores,
    aderenciaMedia
  } = usePrioridadeStats(dataFiltrada);

  // Função para exportar dados para Excel
  const exportarParaExcel = async () => {
    try {
      await exportarPrioridadeParaExcel(sortedEntregadores);
    } catch (err: any) {
      safeLog.error('Erro ao exportar para Excel:', err);
      alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return <DashboardSkeleton contentOnly />;
  }

  if (!entregadoresData) {
    return <PrioridadeErrorState />;
  }

  if (entregadoresData.entregadores.length === 0) {
    return <PrioridadeEmptyState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Prioridade / Promo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Análise detalhada de aderência e performance dos entregadores
              </p>
            </div>
            <Button
              onClick={exportarParaExcel}
              disabled={sortedEntregadores.length === 0}
              variant="outline"
              className="shrink-0"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrioridadeFilters
        filtroAderencia={filtroAderencia}
        filtroRejeicao={filtroRejeicao}
        filtroCompletadas={filtroCompletadas}
        filtroAceitas={filtroAceitas}
        onAderenciaChange={setFiltroAderencia}
        onRejeicaoChange={setFiltroRejeicao}
        onCompletadasChange={setFiltroCompletadas}
        onAceitasChange={setFiltroAceitas}
        onClearFilters={handleClearFilters}
      />

      <PrioridadeSearch
        searchTerm={searchTerm}
        isSearching={isSearching}
        totalResults={dataFiltrada.length}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
      />

      <PrioridadeStatsCards
        totalEntregadores={totalEntregadores}
        totalOfertadas={totalOfertadas}
        totalAceitas={totalAceitas}
        totalRejeitadas={totalRejeitadas}
        totalCompletadas={totalCompletadas}
        aderenciaMedia={aderenciaMedia}
      />

      <PrioridadeTable
        sortedEntregadores={sortedEntregadores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        calcularPercentualAceitas={calcularPercentualAceitas}
        calcularPercentualCompletadas={calcularPercentualCompletadas}
        getAderenciaColor={getAderenciaColor}
        getAderenciaBg={getAderenciaBg}
        getRejeicaoColor={getRejeicaoColor}
        getRejeicaoBg={getRejeicaoBg}
        getAceitasColor={getAceitasColor}
        getAceitasBg={getAceitasBg}
        getCompletadasColor={getCompletadasColor}
        getCompletadasBg={getCompletadasBg}
      />
    </div>
  );
});

PrioridadePromoView.displayName = 'PrioridadePromoView';

export default PrioridadePromoView;
