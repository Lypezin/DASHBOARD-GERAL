import { useState, useEffect, useMemo } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { buildFilterPayload } from '@/utils/helpers';

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
                // Tentar diferentes propriedades comuns
                const semana = item.semana || item.semana_numero || item.numero_semana || item.ano_semana || String(item);
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
        // Converter string para número
        const semanaNumero = typeof semana === 'string'
          ? (semana.includes('W')
            ? parseInt(semana.match(/W(\d+)/)?.[1] || '0', 10)
            : parseInt(semana, 10))
          : semana;

        // Usar buildFilterPayload para garantir que múltiplas praças sejam tratadas corretamente
        // IMPORTANTE: Não incluir semanas array para evitar duplicação de agregação
        const filters = {
          ano: null,
          semana: semanaNumero,
          semanas: [], // Array vazio para evitar duplicação
          praca: pracaSelecionada,
          subPraca: null,
          origem: null,
          turno: null,
          subPracas: [],
          origens: [],
          turnos: [],
          filtroModo: 'ano_semana' as const,
          dataInicial: null,
          dataFinal: null,
        };

        const filtro = buildFilterPayload(filters, currentUser);

        if (IS_DEV) {
          safeLog.info(`[Comparacao] Buscando dados para semana ${semana} (número: ${semanaNumero})`, {
            filtro: {
              p_semana: filtro.p_semana,
              p_praca: filtro.p_praca,
            }
          });
        }

        // Buscar dados do dashboard
        const { data, error } = await safeRpc<DashboardResumoData>('dashboard_resumo', filtro, {
          timeout: 30000,
          validateParams: true
        });
        if (error) throw error;

        if (IS_DEV && data) {
          safeLog.info(`[Comparacao] Dados recebidos para semana ${semana}`, {
            corridasOfertadas: data.totais?.corridas_ofertadas,
            corridasAceitas: data.totais?.corridas_aceitas,
          });
        }

        return { semana, dados: data as DashboardResumoData };
      });

      // Buscar UTR para cada semana
      const promessasUtr = semanasSelecionadas.map(async (semana) => {
        // Converter string para número
        const semanaNumero = typeof semana === 'string'
          ? (semana.includes('W')
            ? parseInt(semana.match(/W(\d+)/)?.[1] || '0', 10)
            : parseInt(semana, 10))
          : semana;

        // Usar buildFilterPayload para garantir que múltiplas praças sejam tratadas corretamente
        // IMPORTANTE: Não incluir semanas array para evitar duplicação de agregação
        const filters = {
          ano: null,
          semana: semanaNumero,
          semanas: [], // Array vazio para evitar duplicação
          praca: pracaSelecionada,
          subPraca: null,
          origem: null,
          turno: null,
          subPracas: [],
          origens: [],
          turnos: [],
          filtroModo: 'ano_semana' as const,
          dataInicial: null,
          dataFinal: null,
        };

        const filtro = buildFilterPayload(filters, currentUser);

        const { data, error } = await safeRpc<UtrData>('calcular_utr', filtro, {
          timeout: 30000,
          validateParams: true
        });
        if (error) throw error;

        return { semana, utr: data };
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
            corridasOfertadas: r.dados?.totais?.corridas_ofertadas
          }))
        });
        safeLog.info('🎯 UTR Comparação:', { semanas: resultadosUtr.length });
      }

      // Garantir que os dados estão na ordem correta das semanas selecionadas
      const dadosOrdenados = semanasSelecionadas.map(semana => {
        const resultado = resultadosDados.find(r => {
          const semanaStr = String(semana);
          const resultadoSemana = String(r.semana);
          // Normalizar comparação (remover W se existir)
          const semanaNormalizada = semanaStr.includes('W') 
            ? semanaStr.match(/W(\d+)/)?.[1] || semanaStr 
            : semanaStr;
          const resultadoNormalizado = resultadoSemana.includes('W')
            ? resultadoSemana.match(/W(\d+)/)?.[1] || resultadoSemana
            : resultadoSemana;
          return semanaNormalizada === resultadoNormalizado;
        });
        return resultado?.dados;
      }).filter((dados): dados is DashboardResumoData => dados !== undefined);

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

