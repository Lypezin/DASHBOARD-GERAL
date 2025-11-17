'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ValoresCidadeDateFilter, ValoresCidadePorCidade, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import MarketingCard from '@/components/MarketingCard';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

const IS_DEV = process.env.NODE_ENV === 'development';

const ValoresCidadeView = React.memo(function ValoresCidadeView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cidadesData, setCidadesData] = useState<ValoresCidadePorCidade[]>([]);
  const [totalGeral, setTotalGeral] = useState<number>(0);
  const [filter, setFilter] = useState<ValoresCidadeDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir query base
      let query = supabase
        .from('dados_valores_cidade')
        .select('cidade, valor');

      // Aplicar filtro de data se houver
      if (filter.dataInicial) {
        query = query.gte('data', filter.dataInicial);
      }
      if (filter.dataFinal) {
        query = query.lte('data', filter.dataFinal);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(`Erro ao buscar dados: ${queryError.message}`);
      }

      if (!data || data.length === 0) {
        setCidadesData([]);
        setTotalGeral(0);
        return;
      }

      // Agrupar por cidade e somar valores
      const cidadeMap = new Map<string, number>();

      data.forEach((row: any) => {
        const cidade = row.cidade || 'Não especificada';
        const valor = Number(row.valor) || 0;
        
        if (cidadeMap.has(cidade)) {
          cidadeMap.set(cidade, cidadeMap.get(cidade)! + valor);
        } else {
          cidadeMap.set(cidade, valor);
        }
      });

      // Converter para array e ordenar por valor (decrescente)
      const cidadesArray: ValoresCidadePorCidade[] = Array.from(cidadeMap.entries())
        .map(([cidade, valor_total]) => ({
          cidade,
          valor_total,
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      setCidadesData(cidadesArray);

      // Calcular total geral
      const total = cidadesArray.reduce((sum, item) => sum + item.valor_total, 0);
      setTotalGeral(total);
    } catch (err: any) {
      safeLog.error('Erro ao buscar dados de Valores por Cidade:', err);
      setError(err.message || 'Erro ao carregar dados de Valores por Cidade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.dataInicial, filter.dataFinal]);

  const handleFilterChange = (newFilter: ValoresCidadeDateFilter) => {
    setFilter(newFilter);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-lg font-semibold text-emerald-700 dark:text-emerald-200">Carregando dados de Valores por Cidade...</p>
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
            className="mt-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MarketingDateFilterComponent
          label="Filtro de Data"
          filter={filter as MarketingDateFilter}
          onFilterChange={(newFilter) => handleFilterChange(newFilter as ValoresCidadeDateFilter)}
        />
      </div>

      {/* Cartão de Total Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketingCard
          title="Total Geral"
          value={totalGeral}
          icon="💰"
          color="green"
        />
      </div>

      {/* Cartões de Cidade */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Valores por Cidade
        </h3>
        {cidadesData.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">
              Nenhum dado encontrado para o período selecionado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cidadesData.map((cidadeData) => (
              <MarketingCard
                key={cidadeData.cidade}
                title={cidadeData.cidade}
                value={cidadeData.valor_total}
                icon="🏙️"
                color="blue"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ValoresCidadeView.displayName = 'ValoresCidadeView';

export default ValoresCidadeView;

