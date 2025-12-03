import React from 'react';
import { EntregadoresData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrioridadeFilters } from './prioridade/PrioridadeFilters';
import { PrioridadeSearch } from './prioridade/PrioridadeSearch';
import { PrioridadeTable } from './prioridade/PrioridadeTable';
import { PrioridadeStatsCards } from './prioridade/PrioridadeStatsCards';
import { usePrioridadeData } from './prioridade/usePrioridadeData';
import { exportarPrioridadeParaExcel } from './prioridade/PrioridadeExcelExport';
import { safeLog } from '@/lib/errorHandler';
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
import {
  Users,
  AlertCircle,
  Download
} from 'lucide-react';

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
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Carregando dados de prioridade...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Não foi possível carregar os dados de prioridade.</p>
        </div>
      </div>
    );
  }

  if (entregadoresData.entregadores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Users className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum entregador encontrado</p>
        <p className="text-sm text-slate-500">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  // Calcular estatísticas gerais com base nos dados filtrados
  const totalOfertadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
  const totalAceitas = dataFiltrada.reduce((sum, e) => sum + e.corridas_aceitas, 0);
  const totalRejeitadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
  const totalCompletadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_completadas, 0);
  const totalEntregadores = dataFiltrada.length;
  const aderenciaMedia = totalEntregadores > 0 ? dataFiltrada.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores : 0;

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
