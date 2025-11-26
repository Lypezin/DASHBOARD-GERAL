'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { ResultadosFilters } from './resultados/ResultadosFilters';
import { ResultadosCards } from './resultados/ResultadosCards';
import { AtendenteData } from './resultados/AtendenteCard';
import { useAtendentesData } from '@/hooks/useAtendentesData';
import { useCustoPorLiberado } from '@/hooks/useCustoPorLiberado';

const IS_DEV = process.env.NODE_ENV === 'development';

interface TotaisData {
  totalEnviado: number;
  totalLiberado: number;
}

const ResultadosView = React.memo(function ResultadosView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atendentesData, setAtendentesData] = useState<AtendenteData[]>([]);
  const [totais, setTotais] = useState<TotaisData>({
    totalEnviado: 0,
    totalLiberado: 0,
  });
  const [filters, setFilters] = useState<{
    filtroLiberacao: MarketingDateFilter;
    filtroEnviados: MarketingDateFilter;
    filtroEnviadosLiberados: MarketingDateFilter;
  }>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
    filtroEnviadosLiberados: { dataInicial: null, dataFinal: null },
  });

  const { fetchAtendentesData } = useAtendentesData();
  const { fetchCustoPorLiberado } = useCustoPorLiberado();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { atendentes, totais: totaisData } = await fetchAtendentesData({
        filtroLiberacao: filters.filtroLiberacao,
        filtroEnviados: filters.filtroEnviados,
      });

      setAtendentesData(atendentes);
      setTotais(totaisData);

      // Buscar custo por liberado após buscar dados dos atendentes
      if (atendentes.length > 0) {
        const atendentesComCusto = await fetchCustoPorLiberado(
          atendentes,
          filters.filtroEnviadosLiberados
        );
        setAtendentesData(atendentesComCusto);
      }
    } catch (err: any) {
      safeLog.error('Erro ao buscar dados de Resultados:', err);
      setError(err.message || 'Erro ao carregar dados de Resultados');
    } finally {
      setLoading(false);
    }
  }, [fetchAtendentesData, fetchCustoPorLiberado, filters]);

  // Buscar dados quando os filtros mudarem
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (filterName: 'filtroLiberacao' | 'filtroEnviados' | 'filtroEnviadosLiberados', filter: MarketingDateFilter) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: filter,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResultadosFilters
        filtroLiberacao={filters.filtroLiberacao}
        filtroEnviados={filters.filtroEnviados}
        filtroEnviadosLiberados={filters.filtroEnviadosLiberados}
        onFiltroLiberacaoChange={(filter) => handleFilterChange('filtroLiberacao', filter)}
        onFiltroEnviadosChange={(filter) => handleFilterChange('filtroEnviados', filter)}
        onFiltroEnviadosLiberadosChange={(filter) => handleFilterChange('filtroEnviadosLiberados', filter)}
      />

      {/* Header com Totais */}
      <div className="space-y-4">
        <ResultadosCards
          totalEnviado={totais.totalEnviado}
          totalLiberado={totais.totalLiberado}
          atendentesData={atendentesData}
        />
      </div>
    </div>
  );
});

ResultadosView.displayName = 'ResultadosView';

export default ResultadosView;

