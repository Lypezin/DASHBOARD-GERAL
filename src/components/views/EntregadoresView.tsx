'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { EntregadoresFilters } from './entregadores/EntregadoresFilters';
import { EntregadoresTable } from './entregadores/EntregadoresTable';
import { EntregadoresStatsCards } from './entregadores/EntregadoresStatsCards';
import { exportarEntregadoresParaExcel } from './entregadores/EntregadoresExcelExport';
import { useEntregadoresData } from './entregadores/useEntregadoresData';
import { safeLog } from '@/lib/errorHandler';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

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
      <div className="flex h-[60vh] items-center justify-center animate-fade-in">
        <div className="max-w-sm mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl">⚠️</div>
          <p className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar entregadores</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchEntregadoresFn();
            }}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Entregadores do Marketing
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Entregadores que aparecem tanto no marketing quanto nas corridas ({entregadoresFiltrados.length} de {entregadores.length} entregador{entregadores.length !== 1 ? 'es' : ''})
              </p>
            </div>
            <Button
              onClick={exportarParaExcel}
              disabled={entregadoresFiltrados.length === 0}
              variant="outline"
              className="shrink-0"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            {searchTerm.trim() ? 'Nenhum entregador encontrado' : 'Nenhum entregador disponível'}
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            {searchTerm.trim()
              ? `Nenhum entregador corresponde à pesquisa "${searchTerm}".`
              : 'Não há entregadores que aparecem tanto no marketing quanto nas corridas.'}
          </p>
        </div>
      )}
    </div>
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
