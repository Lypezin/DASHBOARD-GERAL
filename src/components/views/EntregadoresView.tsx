'use client';

import React, { useCallback } from 'react';
import { EntregadoresFilters } from './entregadores/EntregadoresFilters';
import { EntregadoresTable } from './entregadores/EntregadoresTable';
import { EntregadoresStatsCards } from './entregadores/EntregadoresStatsCards';
import { exportarEntregadoresParaExcel } from './entregadores/EntregadoresExcelExport';
import { useEntregadoresData } from './entregadores/useEntregadoresData';
import { safeLog } from '@/lib/errorHandler';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { EntregadoresHeader } from './entregadores/components/EntregadoresHeader';
import { EntregadoresEmptyState, EntregadoresErrorState } from './entregadores/components/EntregadoresStates';
import { motion, Variants } from 'framer-motion';

interface EntregadoresViewProps {
  // Este componente é usado apenas no Marketing, não recebe props
}

const EntregadoresView = React.memo(function EntregadoresView({
}: EntregadoresViewProps = {}) {
  const {
    entregadores,
    entregadoresFiltrados,
    loading,
    error,
    searchTerm,
    sortField,
    sortDirection,
    filtroRodouDia,
    filtroDataInicio,
    cidadeSelecionada,
    totais,
    setSearchTerm,
    setFiltroRodouDia,
    setFiltroDataInicio,
    setCidadeSelecionada,
    handleSort,
    fetchEntregadoresFn,
    formatarSegundosParaHoras,
    setLoading,
    setError
  } = useEntregadoresData();

  // Função para exportar dados para Excel
  const exportarParaExcel = useCallback(async () => {
    try {
      await exportarEntregadoresParaExcel(entregadoresFiltrados, formatarSegundosParaHoras);
    } catch (err: any) {
      safeLog.error('Erro ao exportar para Excel:', err);
      alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
  }, [entregadoresFiltrados, formatarSegundosParaHoras]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={10} columns={7} />
      </div>
    );
  }

  if (error) {
    return (
      <EntregadoresErrorState
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          fetchEntregadoresFn();
        }}
      />
    );
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
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <EntregadoresHeader
          count={entregadoresFiltrados.length}
          totalCount={entregadores.length}
          hasFilteredData={entregadoresFiltrados.length > 0}
          onExport={exportarParaExcel}
        />
      </motion.div>

      {/* Filtros */}
      <motion.div variants={item}>
        <EntregadoresFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          cidadeSelecionada={cidadeSelecionada}
          onCidadeChange={setCidadeSelecionada}
          filtroRodouDia={filtroRodouDia}
          onFiltroRodouDiaChange={setFiltroRodouDia}
          filtroDataInicio={filtroDataInicio}
          onFiltroDataInicioChange={setFiltroDataInicio}
        />
      </motion.div>

      {/* Cartões de Total */}
      <motion.div variants={item}>
        <EntregadoresStatsCards
          totalEntregadores={totais.totalEntregadores}
          totalSegundos={totais.totalSegundos}
          totalOfertadas={totais.totalOfertadas}
          totalAceitas={totais.totalAceitas}
          totalCompletadas={totais.totalCompletadas}
          totalRejeitadas={totais.totalRejeitadas}
          totalRodandoSim={totais.totalRodandoSim}
          totalRodandoNao={totais.totalRodandoNao}
          formatarSegundosParaHoras={formatarSegundosParaHoras}
        />
      </motion.div>

      {/* Tabela de Entregadores */}
      <motion.div variants={item}>
        {entregadores.length > 0 ? (
          <EntregadoresTable
            entregadores={entregadoresFiltrados}
            formatarSegundosParaHoras={formatarSegundosParaHoras}
            // @ts-ignore
            sortField={sortField}
            // @ts-ignore
            sortDirection={sortDirection}
            // @ts-ignore
            onSort={handleSort}
          />
        ) : (
          <EntregadoresEmptyState searchTerm={searchTerm} />
        )}
      </motion.div>
    </motion.div>
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
