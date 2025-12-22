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
import { motion, Variants } from 'framer-motion';

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


  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-6 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item}>
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900 border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Prioridade / Promo
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Análise detalhada de aderência e performance dos entregadores
                </p>
              </div>
              <Button
                onClick={exportarParaExcel}
                disabled={sortedEntregadores.length === 0}
                variant="outline"
                className="shrink-0 bg-white hover:bg-slate-50 shadow-sm border-slate-200"
              >
                <Download className="mr-2 h-4 w-4 text-indigo-600" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
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
      </motion.div>

      <motion.div variants={item}>
        <PrioridadeSearch
          searchTerm={searchTerm}
          isSearching={isSearching}
          totalResults={dataFiltrada.length}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm('')}
        />
      </motion.div>

      <motion.div variants={item}>
        <PrioridadeStatsCards
          totalEntregadores={totalEntregadores}
          totalOfertadas={totalOfertadas}
          totalAceitas={totalAceitas}
          totalRejeitadas={totalRejeitadas}
          totalCompletadas={totalCompletadas}
          aderenciaMedia={aderenciaMedia}
        />
      </motion.div>

      <motion.div variants={item}>
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
      </motion.div>
    </motion.div>
  );
});

PrioridadePromoView.displayName = 'PrioridadePromoView';

export default PrioridadePromoView;
