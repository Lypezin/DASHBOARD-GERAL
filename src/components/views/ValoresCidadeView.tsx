'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ValoresCidadeDateFilter, ValoresCidadePorCidade, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import MarketingCard from '@/components/MarketingCard';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

const IS_DEV = process.env.NODE_ENV === 'development';

// Função auxiliar para construir query com filtro de data
function buildDateFilterQuery(
  query: any,
  dateColumn: string,
  filter: MarketingDateFilter
) {
  // Se não há filtro aplicado, contar apenas registros onde a data não é null
  if (!filter.dataInicial && !filter.dataFinal) {
    query = query.not(dateColumn, 'is', null);
    return query;
  }
  
  // Se há filtro, aplicar intervalo (não aplicar not null aqui)
  if (filter.dataInicial) {
    query = query.gte(dateColumn, filter.dataInicial);
  }
  if (filter.dataFinal) {
    query = query.lte(dateColumn, filter.dataFinal);
  }
  
  return query;
}

const ValoresCidadeView = React.memo(function ValoresCidadeView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cidadesData, setCidadesData] = useState<ValoresCidadePorCidade[]>([]);
  const [totalGeral, setTotalGeral] = useState<number>(0);
  const [custoPorLiberado, setCustoPorLiberado] = useState<number>(0);
  const [quantidadeLiberados, setQuantidadeLiberados] = useState<number>(0);
  const [filter, setFilter] = useState<ValoresCidadeDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });
  const [filterEnviados, setFilterEnviados] = useState<MarketingDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir query base para valores
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

      // Agrupar por cidade e somar valores
      const cidadeMap = new Map<string, number>();

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          const cidade = row.cidade || 'Não especificada';
          const valor = Number(row.valor) || 0;
          
          if (cidadeMap.has(cidade)) {
            cidadeMap.set(cidade, cidadeMap.get(cidade)! + valor);
          } else {
            cidadeMap.set(cidade, valor);
          }
        });
      }

      // Converter para array inicial
      const cidadesArray: ValoresCidadePorCidade[] = Array.from(cidadeMap.entries())
        .map(([cidade, valor_total]) => ({
          cidade,
          valor_total,
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      // Calcular total geral (usando filtro de Data)
      const total = cidadesArray.reduce((sum, item) => sum + item.valor_total, 0);
      setTotalGeral(total);

      // Buscar valores por cidade usando o filtro de Enviados
      let valoresEnviadosQuery = supabase
        .from('dados_valores_cidade')
        .select('cidade, valor');

      // Aplicar filtro de data usando o filtro de Enviados
      if (filterEnviados.dataInicial) {
        valoresEnviadosQuery = valoresEnviadosQuery.gte('data', filterEnviados.dataInicial);
      }
      if (filterEnviados.dataFinal) {
        valoresEnviadosQuery = valoresEnviadosQuery.lte('data', filterEnviados.dataFinal);
      }

      const { data: valoresEnviadosData, error: valoresEnviadosError } = await valoresEnviadosQuery;

      // Agrupar valores por cidade do período de Enviados
      const valoresEnviadosPorCidade = new Map<string, number>();
      if (!valoresEnviadosError && valoresEnviadosData) {
        valoresEnviadosData.forEach((row: any) => {
          const cidade = row.cidade || 'Não especificada';
          const valor = Number(row.valor) || 0;
          if (valoresEnviadosPorCidade.has(cidade)) {
            valoresEnviadosPorCidade.set(cidade, valoresEnviadosPorCidade.get(cidade)! + valor);
          } else {
            valoresEnviadosPorCidade.set(cidade, valor);
          }
        });
      }

      // Buscar liberados por cidade (com filtro de Enviados e status = 'Liberado')
      // Mapear nome da cidade para regiao_atuacao
      const cidadeToRegiao: { [key: string]: string } = {
        'SÃO PAULO': 'São Paulo 2.0',
        'MANAUS': 'Manaus 2.0',
        'ABC': 'ABC 2.0',
        'SOROCABA': 'Sorocaba 2.0',
        'GUARULHOS': 'Guarulhos 2.0',
        'SALVADOR': 'Salvador 2.0',
        'TABOÃO DA SERRA E EMBU DAS ARTES': 'Taboão da Serra e Embu das Artes 2.0',
      };

      // Calcular custo por liberado para cada cidade
      const cidadesComCusto = await Promise.all(
        cidadesArray.map(async (cidadeData) => {
          const cidadeNome = cidadeData.cidade.toUpperCase();
          const regiaoAtuacao = cidadeToRegiao[cidadeNome] || cidadeData.cidade;

          // Buscar quantidade de liberados para esta cidade
          let liberadosQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });

          // Aplicar filtro de data_envio (filtro de Enviados)
          liberadosQuery = buildDateFilterQuery(liberadosQuery, 'data_envio', filterEnviados);

          // Filtrar por cidade e status Liberado
          liberadosQuery = liberadosQuery.eq('status', 'Liberado');
          
          // Mapear cidade para regiao_atuacao
          if (cidadeNome === 'ABC') {
            liberadosQuery = liberadosQuery.eq('regiao_atuacao', 'ABC 2.0');
          } else {
            liberadosQuery = liberadosQuery.eq('regiao_atuacao', regiaoAtuacao);
          }

          const { count: liberadosCount } = await liberadosQuery;
          const quantidadeLiberados = liberadosCount || 0;

          // Buscar valor total para esta cidade no período de Enviados
          const valorCidadeEnviados = valoresEnviadosPorCidade.get(cidadeData.cidade) || 0;

          // Calcular custo por liberado para esta cidade
          let custoPorLiberado = 0;
          if (quantidadeLiberados > 0) {
            custoPorLiberado = valorCidadeEnviados / quantidadeLiberados;
          }

          return {
            ...cidadeData,
            custo_por_liberado: custoPorLiberado,
          };
        })
      );

      setCidadesData(cidadesComCusto);

      // Calcular média geral de custo por liberado (opcional, para o card principal)
      const totalValorEnviados = Array.from(valoresEnviadosPorCidade.values()).reduce((sum, val) => sum + val, 0);
      
      // Buscar total de liberados (todas as cidades)
      let totalLiberadosQuery = supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });
      
      totalLiberadosQuery = buildDateFilterQuery(totalLiberadosQuery, 'data_envio', filterEnviados);
      totalLiberadosQuery = totalLiberadosQuery.eq('status', 'Liberado');

      const { count: totalLiberadosCount } = await totalLiberadosQuery;
      const totalLiberados = totalLiberadosCount || 0;

      if (totalLiberados > 0) {
        setCustoPorLiberado(totalValorEnviados / totalLiberados);
      } else {
        setCustoPorLiberado(0);
      }
      setQuantidadeLiberados(totalLiberados);
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
  }, [filter.dataInicial, filter.dataFinal, filterEnviados.dataInicial, filterEnviados.dataFinal]);

  const handleFilterChange = (newFilter: ValoresCidadeDateFilter) => {
    setFilter(newFilter);
  };

  const handleFilterEnviadosChange = (newFilter: MarketingDateFilter) => {
    setFilterEnviados(newFilter);
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
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MarketingDateFilterComponent
          label="Filtro de Data"
          filter={filter as MarketingDateFilter}
          onFilterChange={(newFilter) => handleFilterChange(newFilter as ValoresCidadeDateFilter)}
        />
        <MarketingDateFilterComponent
          label="Filtro de Enviados"
          filter={filterEnviados}
          onFilterChange={handleFilterEnviadosChange}
        />
      </div>

      {/* Cartões Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketingCard
          title="Total Geral"
          value={totalGeral}
          icon="💰"
          color="green"
          formatCurrency={true}
        />
        <MarketingCard
          title="Custo por Liberado"
          value={custoPorLiberado}
          icon="📊"
          color="purple"
          formatCurrency={true}
        />
      </div>

      {/* Cartões de Cidade */}
      <div className="space-y-6">
        {/* Valores por Cidade */}
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
                  formatCurrency={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Custo por Liberado por Cidade */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Custo por Liberado por Cidade
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
                  key={`custo-${cidadeData.cidade}`}
                  title={`${cidadeData.cidade} - Custo/Liberado`}
                  value={cidadeData.custo_por_liberado || 0}
                  icon="📊"
                  color="purple"
                  formatCurrency={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ValoresCidadeView.displayName = 'ValoresCidadeView';

export default ValoresCidadeView;

