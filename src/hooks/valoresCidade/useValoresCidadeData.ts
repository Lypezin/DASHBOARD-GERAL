import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { ValoresCidadeDateFilter, ValoresCidadePorCidade, MarketingDateFilter } from '@/types';
import { fetchValores } from './hooks/fetchValores';
import { fetchLiberadosCount } from './hooks/fetchLiberados';

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

      // 1. Fetch Valores Base
      const cidadeMap = await fetchValores(filter);
      const cidadesArray = Array.from(cidadeMap.entries())
        .map(([cidade, valor_total]) => ({ cidade, valor_total }))
        .sort((a, b) => b.valor_total - a.valor_total);

      setTotalGeral(cidadesArray.reduce((sum, item) => sum + item.valor_total, 0));

      // 2. Fetch Valores Enviados
      const valoresEnviadosMap = await fetchValores(filterEnviados);

      // 3. Process Cidades com Custo
      const cidadesComCusto = await Promise.all(
        cidadesArray.map(async (cidadeData) => {
          const quantidadeLiberados = await fetchLiberadosCount(cidadeData.cidade, filterEnviados);
          const valorCidadeEnviados = valoresEnviadosMap.get(cidadeData.cidade) || 0;

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

      // 4. Calculate Global Stats
      const totalValorEnviados = Array.from(valoresEnviadosMap.values()).reduce((sum, val) => sum + val, 0);
      const cidadesComValores = Array.from(valoresEnviadosMap.keys());
      let totalLiberados = 0;

      for (const cidadeNome of cidadesComValores) {
        totalLiberados += await fetchLiberadosCount(cidadeNome, filterEnviados);
      }

      setCustoPorLiberado(totalLiberados > 0 ? totalValorEnviados / totalLiberados : 0);
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
