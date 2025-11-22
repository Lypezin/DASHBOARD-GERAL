/**
 * Hook para buscar dados dos atendentes
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { MarketingDateFilter, AtendenteCidadeData } from '@/types';
import { AtendenteData } from '@/components/views/resultados/AtendenteCard';
import { CIDADES } from '@/constants/marketing';
import { ATENDENTES, ATENDENTES_FOTOS } from '@/utils/atendenteMappers';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

interface TotaisData {
  totalEnviado: number;
  totalLiberado: number;
}

export function useAtendentesData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAtendentesData = useCallback(async (
    filters: {
      filtroLiberacao: MarketingDateFilter;
      filtroEnviados: MarketingDateFilter;
    }
  ): Promise<{ atendentes: AtendenteData[]; totais: TotaisData }> => {
    setLoading(true);
    setError(null);

    try {
      // Tentar usar RPC primeiro
      const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        responsavel: string;
        enviado: number;
        liberado: number;
        cidade: string;
        cidade_enviado: number;
        cidade_liberado: number;
      }>>('get_marketing_atendentes_data', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
      }, { validateParams: false });

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        // Agrupar dados por atendente
        const atendentesMap = new Map<string, AtendenteData>();
        let totalEnviado = 0;
        let totalLiberado = 0;

        // Processar dados RPC
        for (const item of rpcData) {
          if (!atendentesMap.has(item.responsavel)) {
            atendentesMap.set(item.responsavel, {
              nome: item.responsavel,
              enviado: item.enviado || 0,
              liberado: item.liberado || 0,
              fotoUrl: ATENDENTES_FOTOS[item.responsavel] || null,
              cidades: [],
            });
            totalEnviado += item.enviado || 0;
            totalLiberado += item.liberado || 0;
          }

          const atendenteData = atendentesMap.get(item.responsavel)!;

          if (item.cidade && (item.cidade_enviado > 0 || item.cidade_liberado > 0)) {
            atendenteData.cidades!.push({
              atendente: item.responsavel,
              cidade: item.cidade,
              enviado: item.cidade_enviado || 0,
              liberado: item.cidade_liberado || 0,
            });
          }
        }

        // Garantir que todos os atendentes estejam presentes
        const atendentesDataArray: AtendenteData[] = ATENDENTES.map(atendente => {
          const data = atendentesMap.get(atendente);
          if (data) {
            return data;
          }
          return {
            nome: atendente,
            enviado: 0,
            liberado: 0,
            fotoUrl: ATENDENTES_FOTOS[atendente] || null,
            cidades: CIDADES.map(cidade => ({
              atendente,
              cidade,
              enviado: 0,
              liberado: 0,
            })),
          };
        });

        return {
          atendentes: atendentesDataArray,
          totais: { totalEnviado, totalLiberado },
        };
      }

      // Fallback para queries diretas
      if (IS_DEV) {
        safeLog.warn('RPC get_marketing_atendentes_data não disponível, usando fallback');
      }

      const atendentesDataArray: AtendenteData[] = [];
      let totalEnviado = 0;
      let totalLiberado = 0;

      for (const atendente of ATENDENTES) {
        // Enviado (com filtro de Enviados)
        let enviadoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        enviadoQuery = enviadoQuery.eq('responsavel', atendente);
        enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
        const { count: enviadoCount } = await enviadoQuery;

        // Liberado (com filtro de Liberação)
        let liberadoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        liberadoQuery = liberadoQuery.eq('responsavel', atendente);
        liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
        const { count: liberadoCount } = await liberadoQuery;

        const enviado = enviadoCount || 0;
        const liberado = liberadoCount || 0;
        totalEnviado += enviado;
        totalLiberado += liberado;

        // Buscar métricas por cidade para este atendente
        const cidadesData: AtendenteCidadeData[] = [];
        for (const cidade of CIDADES) {
          // Enviado por cidade
          let enviadoCidadeQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });
          enviadoCidadeQuery = enviadoCidadeQuery.eq('responsavel', atendente);
          enviadoCidadeQuery = buildCityQuery(enviadoCidadeQuery, cidade);
          enviadoCidadeQuery = buildDateFilterQuery(enviadoCidadeQuery, 'data_envio', filters.filtroEnviados);
          const { count: enviadoCidadeCount } = await enviadoCidadeQuery;

          // Liberado por cidade
          let liberadoCidadeQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });
          liberadoCidadeQuery = liberadoCidadeQuery.eq('responsavel', atendente);
          liberadoCidadeQuery = buildCityQuery(liberadoCidadeQuery, cidade);
          liberadoCidadeQuery = buildDateFilterQuery(liberadoCidadeQuery, 'data_liberacao', filters.filtroLiberacao);
          const { count: liberadoCidadeCount } = await liberadoCidadeQuery;

          cidadesData.push({
            atendente,
            cidade,
            enviado: enviadoCidadeCount || 0,
            liberado: liberadoCidadeCount || 0,
          });
        }

        atendentesDataArray.push({
          nome: atendente,
          enviado,
          liberado,
          fotoUrl: ATENDENTES_FOTOS[atendente] || null,
          cidades: cidadesData,
        });
      }

      return {
        atendentes: atendentesDataArray,
        totais: { totalEnviado, totalLiberado },
      };
    } catch (err: any) {
      safeLog.error('Erro ao buscar dados dos atendentes:', err);
      setError(err.message || 'Erro ao buscar dados dos atendentes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchAtendentesData,
    loading,
    error,
  };
}

