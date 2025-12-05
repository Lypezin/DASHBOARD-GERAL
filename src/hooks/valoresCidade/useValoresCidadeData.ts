import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { ValoresCidadeDateFilter, ValoresCidadePorCidade, MarketingDateFilter } from '@/types';
import { buildDateFilterQuery, ensureMarketingDateFilter } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

const cidadeToRegiao: { [key: string]: string } = {
  'SÃO PAULO': 'São Paulo 2.0',
  'MANAUS': 'Manaus 2.0',
  'ABC': 'ABC 2.0',
  'SOROCABA': 'Sorocaba 2.0',
  'GUARULHOS': 'Guarulhos 2.0',
  'SALVADOR': 'Salvador 2.0',
  'TABOÃO DA SERRA E EMBU DAS ARTES': 'Taboão da Serra e Embu das Artes 2.0',
};

export const useValoresCidadeData = (
  isAuthenticated: boolean,
  filter: ValoresCidadeDateFilter,
  filterEnviados: MarketingDateFilter
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cidadesData, setCidadesData] = useState<ValoresCidadePorCidade[]>([]);
  const [totalGeral, setTotalGeral] = useState<number>(0);
  const [custoPorLiberado, setCustoPorLiberado] = useState<number>(0);
  const [quantidadeLiberados, setQuantidadeLiberados] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Garantir filtro de data obrigatório
      const safeFilter = ensureMarketingDateFilter(filter);

      if (IS_DEV) {
        safeLog.info('[useValoresCidadeData] Buscando dados_valores_cidade com filtro:', {
          dataInicial: safeFilter.dataInicial,
          dataFinal: safeFilter.dataFinal,
        });
      }

      let query = supabase
        .from('dados_valores_cidade')
        .select('cidade, valor');

      if (safeFilter.dataInicial) {
        query = query.gte('data', safeFilter.dataInicial);
      }
      if (safeFilter.dataFinal) {
        query = query.lte('data', safeFilter.dataFinal);
      }

      const { data, error: queryError } = await query;

      if (IS_DEV) {
        safeLog.info('[useValoresCidadeData] Resultado da query:', {
          dataLength: data?.length || 0,
          hasError: !!queryError,
          errorMessage: queryError?.message,
          primeirasTresLinhas: data?.slice(0, 3),
        });
      }

      if (queryError) {
        throw new Error(`Erro ao buscar dados: ${queryError.message}`);
      }

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

      const cidadesArray: ValoresCidadePorCidade[] = Array.from(cidadeMap.entries())
        .map(([cidade, valor_total]) => ({
          cidade,
          valor_total,
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      const total = cidadesArray.reduce((sum, item) => sum + item.valor_total, 0);
      setTotalGeral(total);

      // Garantir filtro de data obrigatório para valores enviados
      const safeFilterEnviados = ensureMarketingDateFilter(filterEnviados);

      let valoresEnviadosQuery = supabase
        .from('dados_valores_cidade')
        .select('cidade, valor');

      if (safeFilterEnviados.dataInicial) {
        valoresEnviadosQuery = valoresEnviadosQuery.gte('data', safeFilterEnviados.dataInicial);
      }
      if (safeFilterEnviados.dataFinal) {
        valoresEnviadosQuery = valoresEnviadosQuery.lte('data', safeFilterEnviados.dataFinal);
      }

      const { data: valoresEnviadosData, error: valoresEnviadosError } = await valoresEnviadosQuery;

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

      const cidadesComCusto = await Promise.all(
        cidadesArray.map(async (cidadeData) => {
          const cidadeNome = cidadeData.cidade.toUpperCase();
          const regiaoAtuacao = cidadeToRegiao[cidadeNome] || cidadeData.cidade;

          let liberadosQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });

          liberadosQuery = buildDateFilterQuery(liberadosQuery, 'data_envio', filterEnviados);
          liberadosQuery = liberadosQuery.eq('status', 'Liberado');

          if (cidadeNome === 'ABC') {
            liberadosQuery = liberadosQuery.eq('regiao_atuacao', 'ABC 2.0');
          } else {
            liberadosQuery = liberadosQuery.eq('regiao_atuacao', regiaoAtuacao);
          }

          const { count: liberadosCount } = await liberadosQuery;
          const quantidadeLiberados = liberadosCount || 0;

          const valorCidadeEnviados = valoresEnviadosPorCidade.get(cidadeData.cidade) || 0;

          let custoPorLiberado = 0;
          if (quantidadeLiberados > 0) {
            custoPorLiberado = valorCidadeEnviados / quantidadeLiberados;
          }

          return {
            ...cidadeData,
            custo_por_liberado: custoPorLiberado,
            quantidade_liberados: quantidadeLiberados,
            valor_total_enviados: valorCidadeEnviados,
          };
        })
      );

      setCidadesData(cidadesComCusto);

      const totalValorEnviados = Array.from(valoresEnviadosPorCidade.values()).reduce((sum, val) => sum + val, 0);
      const cidadesComValores = Array.from(valoresEnviadosPorCidade.keys());

      let totalLiberados = 0;

      for (const cidadeNome of cidadesComValores) {
        const cidadeUpper = cidadeNome.toUpperCase();
        const regiaoAtuacao = cidadeToRegiao[cidadeUpper] || cidadeNome;

        let liberadosQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });

        liberadosQuery = buildDateFilterQuery(liberadosQuery, 'data_envio', filterEnviados);
        liberadosQuery = liberadosQuery.eq('status', 'Liberado');

        if (cidadeUpper === 'ABC') {
          liberadosQuery = liberadosQuery.eq('regiao_atuacao', 'ABC 2.0');
        } else {
          liberadosQuery = liberadosQuery.eq('regiao_atuacao', regiaoAtuacao);
        }

        const { count: liberadosCount } = await liberadosQuery;
        totalLiberados += liberadosCount || 0;
      }

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
    if (isAuthenticated) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filter.dataInicial, filter.dataFinal, filterEnviados.dataInicial, filterEnviados.dataFinal]);

  return {
    loading,
    error,
    cidadesData,
    totalGeral,
    custoPorLiberado,
    quantidadeLiberados,
  };
};

