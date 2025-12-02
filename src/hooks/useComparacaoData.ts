import { useState, useEffect, useMemo } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { buildFilterPayload } from '@/utils/helpers';
import { createComparisonFilter, parseWeekString } from '@/utils/comparacaoHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseComparacaoDataOptions {
  semanas: string[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  currentUser: CurrentUser | null;
}

export function useComparacaoData(options: UseComparacaoDataOptions) {
  const { semanasSelecionadas, pracaSelecionada, currentUser } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<Array<{ semana: string | number; utr: UtrData | null }>>([]);
  const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);

  // Buscar TODAS as semanas disponíveis (sem filtro)
  useEffect(() => {
    async function fetchTodasSemanas() {
      try {
        const { data, error } = await safeRpc<any[]>('listar_todas_semanas', {}, {
          timeout: 30000,
          validateParams: false
        });

        if (error) {
          safeLog.error('Erro ao buscar semanas:', error);
          // Fallback: usar semanas do prop se disponível
          if (options.semanas && options.semanas.length > 0) {
            setTodasSemanas(options.semanas);
          }
          return;
        }

        if (data) {
          // A função retorna um objeto com propriedade listar_todas_semanas contendo o array
          let semanasArray: unknown[] = [];

          if (Array.isArray(data)) {
            semanasArray = data;
          } else if (data && typeof data === 'object') {
            // Se for objeto, tentar extrair o array da propriedade listar_todas_semanas
            semanasArray = (data as any).listar_todas_semanas || (data as any).semanas || [];
          }

          // Processar o array de semanas
          let semanasProcessadas: (number | string)[] = [];

          if (Array.isArray(semanasArray) && semanasArray.length > 0) {
            // Se o primeiro item é um objeto, extrair a propriedade de semana
            if (typeof semanasArray[0] === 'object' && semanasArray[0] !== null) {
              semanasProcessadas = (semanasArray as Record<string, unknown>[]).map((item) => {
                // Tentar construir formato YYYY-Www se ano e semana estiverem disponíveis
                if (item.ano && (item.semana || item.semana_numero)) {
                  const s = item.semana || item.semana_numero;
                  return `${item.ano}-W${s}`;
                }

                // Tentar diferentes propriedades comuns
                const semana = item.ano_semana || item.semana || item.semana_numero || item.numero_semana || String(item);
                return typeof semana === 'number' ? semana : String(semana);
              }).filter((s): s is string | number => Boolean(s));
            } else {
              // Já é array de strings/números
              semanasProcessadas = semanasArray.map((s: unknown) => String(s));
            }
          }

          if (IS_DEV) {
            safeLog.info('Semanas carregadas:', {
              total: semanasProcessadas.length,
              semanas: semanasProcessadas.slice(0, 5),
              formatoOriginal: Array.isArray(data) ? 'array' : 'objeto'
            });
          }

          if (semanasProcessadas.length > 0) {
            setTodasSemanas(semanasProcessadas);
          } else if (options.semanas && options.semanas.length > 0) {
            // Fallback: usar semanas do prop
            setTodasSemanas(options.semanas);
          }
        } else if (options.semanas && options.semanas.length > 0) {
          // Fallback: usar semanas do prop se data for null
          setTodasSemanas(options.semanas);
        }
      } catch (err) {
        safeLog.error('Erro ao buscar semanas:', err);
        // Fallback: usar semanas do prop
        if (options.semanas && options.semanas.length > 0) {
          setTodasSemanas(options.semanas);
        }
      }
    }
    fetchTodasSemanas();
  }, [options.semanas]);

  const compararSemanas = async () => {
    if (semanasSelecionadas.length < 2) return;

    setLoading(true);
    setError(null);
    try {
      // Buscar dados para cada semana selecionada
      const promessasDados = semanasSelecionadas.map(async (semana) => {
        // Usar helper para criar filtro
        const filtro = createComparisonFilter(semana, pracaSelecionada, currentUser);
        const { semanaNumero, anoNumero } = parseWeekString(semana);

        if (IS_DEV) {
          safeLog.info(`[Comparacao] Buscando dados para semana ${semana} (ano: ${anoNumero}, número: ${semanaNumero})`, {
            filtro: {
              p_ano: filtro.p_ano,
              p_semana: filtro.p_semana,
              p_praca: filtro.p_praca,
            }
          });
        }

        // Buscar dados do dashboard
        const { data: rawData, error } = await safeRpc<DashboardResumoData | DashboardResumoData[]>('dashboard_resumo', filtro, {
          timeout: 30000,
          validateParams: true
        });
        if (error) throw error;

        // A função dashboard_resumo retorna SETOF record, então o Supabase retorna um array
        const data = Array.isArray(rawData) ? rawData[0] : rawData;

        if (IS_DEV && data) {
          safeLog.info(`[Comparacao] Dados recebidos para semana ${semana}`, {
            corridasOfertadas: data.total_ofertadas,
            corridasAceitas: data.total_aceitas,
          });
        }

        return { semana, dados: data as DashboardResumoData };
      });

      // Buscar UTR para cada semana
      const promessasUtr = semanasSelecionadas.map(async (semana) => {
        const filtro = createComparisonFilter(semana, pracaSelecionada, currentUser);

        try {
          const { data, error } = await safeRpc<UtrData>('calcular_utr', filtro, {
            timeout: 30000,
            validateParams: true
          });

          if (error) {
            safeLog.error(`[Comparacao] Erro ao calcular UTR para semana ${semana}:`, error);
            return { semana, utr: null };
          }

          return { semana, utr: data };
        } catch (err) {
          safeLog.error(`[Comparacao] Exceção ao calcular UTR para semana ${semana}:`, err);
          // Retornar null em vez de falhar completamente
          return { semana, utr: null };
        }
      });

      const resultadosDados = await Promise.all(promessasDados);
      const resultadosUtr = await Promise.all(promessasUtr);

      if (IS_DEV) {
        safeLog.info('📊 Dados Comparação:', {
          semanas: resultadosDados.length,
          semanasSelecionadas: semanasSelecionadas,
          resultados: resultadosDados.map(r => ({
            semana: r.semana,
            hasData: !!r.dados,
            corridasOfertadas: r.dados?.total_ofertadas
          }))
        });
        safeLog.info('🎯 UTR Comparação:', { semanas: resultadosUtr.length });
      }

      // Garantir que os dados estão na ordem correta das semanas selecionadas
      // Como usamos Promise.all no map de semanasSelecionadas, a ordem já está garantida
      const dadosOrdenados = resultadosDados.map(resultado => {
        const defaultData: DashboardResumoData = {
          total_ofertadas: 0,
          total_aceitas: 0,
          total_completadas: 0,
          total_rejeitadas: 0,
          aderencia_semanal: [],
          aderencia_dia: [],
          aderencia_turno: [],
          aderencia_sub_praca: [],
          aderencia_origem: [],
          dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [] }
        };

        const dados = resultado.dados ? { ...defaultData, ...resultado.dados } : defaultData;

        return dados;
      });

      setDadosComparacao(dadosOrdenados);
      setUtrComparacao(resultadosUtr);

    } catch (error) {
      safeLog.error('Erro ao comparar semanas:', error);
      setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    dadosComparacao,
    utrComparacao,
    todasSemanas,
    compararSemanas,
  };
}

