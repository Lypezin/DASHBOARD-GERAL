'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { EntregadoresFilters } from './entregadores/EntregadoresFilters';
import { EntregadoresTable } from './entregadores/EntregadoresTable';
import { EntregadoresStatsCards } from './entregadores/EntregadoresStatsCards';
import { exportarEntregadoresParaExcel } from './entregadores/EntregadoresExcelExport';
import { fetchEntregadores, fetchEntregadoresFallback } from './entregadores/EntregadoresDataFetcher';

interface EntregadoresViewProps {
  // Este componente é usado apenas no Marketing, não recebe props
}

const EntregadoresView = React.memo(function EntregadoresView({
}: EntregadoresViewProps = {}) {
  const [entregadores, setEntregadores] = useState<EntregadorMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroRodouDia, setFiltroRodouDia] = useState<MarketingDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });
  const [filtroDataInicio, setFiltroDataInicio] = useState<MarketingDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');

  const fetchEntregadoresFallbackFn = useCallback(async () => {
    const data = await fetchEntregadoresFallback(filtroDataInicio, cidadeSelecionada);
    setEntregadores(data);
    return data;
  }, [filtroDataInicio, cidadeSelecionada]);

  const fetchEntregadoresFn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchEntregadores(
        filtroRodouDia,
        filtroDataInicio,
        cidadeSelecionada,
        fetchEntregadoresFallbackFn
      );

      setEntregadores(data);
    } catch (err: any) {
      safeLog.error('Erro ao buscar entregadores:', err);
      setError(err.message || 'Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  }, [filtroRodouDia, filtroDataInicio, cidadeSelecionada, fetchEntregadoresFallbackFn]);

  useEffect(() => {
    // Este componente é usado apenas no Marketing, sempre buscar dados
    fetchEntregadoresFn();
  }, [fetchEntregadoresFn]);

  // Filtrar entregadores por nome ou ID
  const entregadoresFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return entregadores;
    }
    
    const termo = searchTerm.toLowerCase().trim();
    return entregadores.filter(e => 
      e.nome.toLowerCase().includes(termo) ||
      e.id_entregador.toLowerCase().includes(termo)
    );
  }, [entregadores, searchTerm]);

  // Função para formatar segundos em horas (HH:MM:SS)
  const formatarSegundosParaHoras = useCallback((segundos: number): string => {
    if (!segundos || segundos === 0) return '00:00:00';
    const horas = segundos / 3600;
    return formatarHorasParaHMS(horas);
  }, []);

  // Calcular totais para os cartões
  const totais = useMemo(() => {
    const totalEntregadores = entregadoresFiltrados.length;
    const totalSegundos = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_segundos || 0), 0);
    return {
      totalEntregadores,
      totalSegundos,
    };
  }, [entregadoresFiltrados]);

  // Função para exportar dados para Excel
  const exportarParaExcel = useCallback(() => {
    try {
      exportarEntregadoresParaExcel(entregadoresFiltrados, formatarSegundosParaHoras);
    } catch (err: any) {
      alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
  }, [entregadoresFiltrados, formatarSegundosParaHoras]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando entregadores...</p>
        </div>
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
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:border-purple-900 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              Entregadores do Marketing
            </h2>
            <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
              Entregadores que aparecem tanto no marketing quanto nas corridas ({entregadoresFiltrados.length} de {entregadores.length} entregador{entregadores.length !== 1 ? 'es' : ''})
            </p>
          </div>
          <Button
            onClick={exportarParaExcel}
            disabled={entregadoresFiltrados.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800 shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

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
        formatarSegundosParaHoras={formatarSegundosParaHoras}
      />

      {/* Tabela de Entregadores */}
      {entregadores.length > 0 ? (
        <EntregadoresTable
          entregadores={entregadoresFiltrados}
          formatarSegundosParaHoras={formatarSegundosParaHoras}
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
