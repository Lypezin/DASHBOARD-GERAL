/**
 * Hook para calcular custo por liberado por atendente e por cidade
 */

import { useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { MarketingDateFilter } from '@/types';
import { AtendenteData } from '@/components/views/resultados/AtendenteCard';
import { findCidadeValue } from '@/utils/atendenteMappers';
import { fetchAndProcessValores } from '@/hooks/resultados/utils/valoresHelper';
import { fetchLiberadosCount } from '@/hooks/resultados/utils/liberadosHelper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useCustoPorLiberado() {
  const fetchCustoPorLiberado = useCallback(async (
    atendentesDataAtual: AtendenteData[],
    filtroEnviadosLiberados: MarketingDateFilter
  ): Promise<AtendenteData[]> => {
    try {
      const valoresPorAtendenteECidade = await fetchAndProcessValores(filtroEnviadosLiberados);

      // Calcular custo por liberado por atendente e por cidade
      const atendentesComCusto = await Promise.all(
        atendentesDataAtual.map(async (atendente) => {
          // Buscar liberados totais
          const quantidadeLiberados = await fetchLiberadosCount(atendente.nome, filtroEnviadosLiberados);

          // Buscar valores deste atendente
          const valoresAtendente = valoresPorAtendenteECidade.get(atendente.nome) || new Map<string, number>();
          let valorTotalAtendente = 0;

          // Calcular custo por liberado por cidade para este atendente
          const cidadesComCustoAtendente = await Promise.all(
            (atendente.cidades || []).map(async (cidadeData) => {
              const valorCidade = findCidadeValue(cidadeData, valoresAtendente);
              const quantidadeLiberadosCidade = await fetchLiberadosCount(atendente.nome, filtroEnviadosLiberados, cidadeData.cidade);

              let custoPorLiberadoCidade = 0;
              if (quantidadeLiberadosCidade > 0 && valorCidade > 0) {
                custoPorLiberadoCidade = valorCidade / quantidadeLiberadosCidade;
              }

              valorTotalAtendente += valorCidade;

              return {
                ...cidadeData,
                custoPorLiberado: custoPorLiberadoCidade > 0 ? custoPorLiberadoCidade : undefined,
                quantidadeLiberados: quantidadeLiberadosCidade,
                valorTotal: valorCidade,
              };
            })
          );

          let custoPorLiberado = 0;
          if (quantidadeLiberados > 0 && valorTotalAtendente > 0) {
            custoPorLiberado = valorTotalAtendente / quantidadeLiberados;
          }

          if (IS_DEV && atendente.nome === 'Fernanda Raphaelly') {
            safeLog.info('Fernanda Raphaelly - Debug:', {
              quantidadeLiberados,
              valorTotalAtendente,
              custoPorLiberado,
              valoresAtendente: Array.from(valoresAtendente.entries()),
              cidadesComCusto: cidadesComCustoAtendente.map(c => ({
                cidade: c.cidade,
                valorTotal: c.valorTotal,
                quantidadeLiberados: c.quantidadeLiberados,
                custoPorLiberado: c.custoPorLiberado,
              })),
            });
          }

          return {
            ...atendente,
            custoPorLiberado: custoPorLiberado > 0 ? custoPorLiberado : undefined,
            quantidadeLiberados: quantidadeLiberados,
            valorTotal: valorTotalAtendente,
            cidades: cidadesComCustoAtendente,
          };
        })
      );

      return atendentesComCusto;
    } catch (err: any) {
      safeLog.error('Erro ao buscar custo por liberado:', err);
      return atendentesDataAtual;
    }
  }, []);

  return { fetchCustoPorLiberado };
}
