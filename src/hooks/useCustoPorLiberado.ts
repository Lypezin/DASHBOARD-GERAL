/**
 * Hook para calcular custo por liberado por atendente e por cidade
 */

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { MarketingDateFilter } from '@/types';
import { AtendenteData } from '@/components/views/resultados/AtendenteCard';
import { ATENDENTE_TO_ID, findCidadeValue } from '@/utils/atendenteMappers';
import { SANTO_ANDRE_SUB_PRACAS, SAO_BERNARDO_SUB_PRACAS } from '@/constants/marketing';
import { buildDateFilterQuery, ensureMarketingDateFilter } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useCustoPorLiberado() {
  const fetchCustoPorLiberado = useCallback(async (
    atendentesDataAtual: AtendenteData[],
    filtroEnviadosLiberados: MarketingDateFilter
  ): Promise<AtendenteData[]> => {
    try {
      // Garantir filtro de data obrigatório
      const safeFilter = ensureMarketingDateFilter(filtroEnviadosLiberados);

      // Buscar valores por cidade e por atendente usando o filtro de Enviados Liberados
      let valoresQuery = supabase
        .from('dados_valores_cidade')
        .select('id_atendente, cidade, valor');

      if (safeFilter.dataInicial) {
        valoresQuery = valoresQuery.gte('data', safeFilter.dataInicial);
      }
      if (safeFilter.dataFinal) {
        valoresQuery = valoresQuery.lte('data', safeFilter.dataFinal);
      }

      const { data: valoresData, error: valoresError } = await valoresQuery;

      // Agrupar valores por atendente e cidade: Map<atendenteNome, Map<cidade, valor>>
      const valoresPorAtendenteECidade = new Map<string, Map<string, number>>();
      if (!valoresError && valoresData) {
        valoresData.forEach((row: any) => {
          const idAtendenteRaw = row.id_atendente;
          const idAtendente = idAtendenteRaw != null ? String(idAtendenteRaw).trim() : '';
          const cidade = String(row.cidade || 'Não especificada').trim();
          const valor = Number(row.valor) || 0;

          // Encontrar o nome do atendente pelo ID
          let atendenteNome = '';
          for (const [nome, id] of Object.entries(ATENDENTE_TO_ID)) {
            if (String(id).trim() === idAtendente) {
              atendenteNome = nome;
              break;
            }
          }

          if (atendenteNome) {
            if (!valoresPorAtendenteECidade.has(atendenteNome)) {
              valoresPorAtendenteECidade.set(atendenteNome, new Map<string, number>());
            }
            const cidadeMap = valoresPorAtendenteECidade.get(atendenteNome)!;
            if (cidadeMap.has(cidade)) {
              cidadeMap.set(cidade, cidadeMap.get(cidade)! + valor);
            } else {
              cidadeMap.set(cidade, valor);
            }
          }
        });
      }

      if (IS_DEV) {
        const valoresFernanda = valoresPorAtendenteECidade.get('Fernanda Raphaelly');
        safeLog.info('Valores encontrados para Fernanda Raphaelly:', {
          encontrou: !!valoresFernanda,
          valores: valoresFernanda ? Array.from(valoresFernanda.entries()) : [],
          totalValores: valoresData?.length || 0,
        });
      }

      // Calcular custo por liberado por atendente e por cidade
      const atendentesComCusto = await Promise.all(
        atendentesDataAtual.map(async (atendente) => {
          // Buscar liberados deste atendente
          let liberadosQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });

          liberadosQuery = buildDateFilterQuery(liberadosQuery, 'data_envio', filtroEnviadosLiberados);
          liberadosQuery = liberadosQuery.eq('status', 'Liberado');
          liberadosQuery = liberadosQuery.eq('responsavel', atendente.nome);

          const { count: liberadosCount } = await liberadosQuery;
          const quantidadeLiberados = liberadosCount || 0;

          // Buscar valores deste atendente
          const valoresAtendente = valoresPorAtendenteECidade.get(atendente.nome) || new Map<string, number>();
          let valorTotalAtendente = 0;

          // Calcular custo por liberado por cidade para este atendente
          const cidadesComCustoAtendente = await Promise.all(
            (atendente.cidades || []).map(async (cidadeData) => {
              // Encontrar valor da cidade
              const valorCidade = findCidadeValue(cidadeData, valoresAtendente);

              // Buscar quantidade de liberados para esta cidade e este atendente
              let liberadosCidadeQuery = supabase
                .from('dados_marketing')
                .select('*', { count: 'exact', head: true });

              liberadosCidadeQuery = buildDateFilterQuery(liberadosCidadeQuery, 'data_envio', filtroEnviadosLiberados);
              liberadosCidadeQuery = liberadosCidadeQuery.eq('status', 'Liberado');
              liberadosCidadeQuery = liberadosCidadeQuery.eq('responsavel', atendente.nome);

              // Mapear cidade para regiao_atuacao
              if (cidadeData.cidade === 'ABC' || cidadeData.cidade === 'ABC 2.0') {
                liberadosCidadeQuery = liberadosCidadeQuery.eq('regiao_atuacao', 'ABC 2.0');
              } else if (cidadeData.cidade === 'Santo André') {
                liberadosCidadeQuery = liberadosCidadeQuery
                  .eq('regiao_atuacao', 'ABC 2.0')
                  .in('sub_praca_abc', SANTO_ANDRE_SUB_PRACAS);
              } else if (cidadeData.cidade === 'São Bernardo') {
                liberadosCidadeQuery = liberadosCidadeQuery
                  .eq('regiao_atuacao', 'ABC 2.0')
                  .in('sub_praca_abc', SAO_BERNARDO_SUB_PRACAS);
              } else {
                liberadosCidadeQuery = liberadosCidadeQuery.eq('regiao_atuacao', cidadeData.cidade);
              }

              const { count: liberadosCidadeCount } = await liberadosCidadeQuery;
              const quantidadeLiberadosCidade = liberadosCidadeCount || 0;

              // Calcular custo por liberado para esta cidade
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

          // Calcular custo por liberado total do atendente
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

