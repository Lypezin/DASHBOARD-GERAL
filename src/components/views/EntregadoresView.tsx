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

  return (
    <div className="space-y-6 animate-fade-in">
      <EntregadoresHeader
        count={entregadoresFiltrados.length}
        totalCount={entregadores.length}
        hasFilteredData={entregadoresFiltrados.length > 0}
        onExport={exportarParaExcel}
      />

      {/* Filtros */}
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

      {/* Cartões de Total */}
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

      {/* Tabela de Entregadores */}
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
    </div>
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
