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
        // Converter string para número e extrair ano se disponível
        let semanaNumero: number;
        let anoNumero: number | null = null;

        if (typeof semana === 'string') {
          if (semana.includes('W')) {
            // Formato: "2025-W45" ou "S2025-W45"
            const anoMatch = semana.match(/(\d{4})/);
            const semanaMatch = semana.match(/W(\d+)/);
            anoNumero = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();
            semanaNumero = semanaMatch ? parseInt(semanaMatch[1], 10) : parseInt(semana, 10);
          } else {
            // Apenas número da semana, usar ano atual
            semanaNumero = parseInt(semana, 10);
            anoNumero = new Date().getFullYear();
          }
        } else {
          semanaNumero = semana;
          anoNumero = new Date().getFullYear();
        }

        // Usar buildFilterPayload para garantir que múltiplas praças sejam tratadas corretamente
        // IMPORTANTE: Não incluir semanas array para evitar duplicação de agregação
        // IMPORTANTE: Sempre passar ano junto com semana para a função RPC funcionar corretamente
        const filters = {
          ano: anoNumero,
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

        // DEBUG: Log payload com mais detalhes
        console.log(`%c[Comparacao] 🔍 Requesting data for SEMANA ${semana}`, 'color: #3b82f6; font-weight: bold');
        console.table({
          semana_original: semana,
          semana_numero: semanaNumero,
          ano: anoNumero,
          p_ano: filtro.p_ano,
          p_semana: filtro.p_semana,
          p_praca: filtro.p_praca
        });
        console.log('Full payload:', filtro);

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

        // DEBUG: Log response com mais detalhes
        console.log(`%c[Comparacao] ✅ Response for SEMANA ${semana}`, 'color: #10b981; font-weight: bold');
        console.table({
          hasData: !!data,
          isArray: Array.isArray(rawData),
          corridasOfertadas: data?.totais?.corridas_ofertadas || 0,
          corridasAceitas: data?.totais?.corridas_aceitas || 0,
          diaLength: data?.dia?.length || 0
        });

        if (data?.dia && data.dia.length > 0) {
          console.log('First day sample:', data.dia[0]);
        } else {
          console.warn(`%c⚠️ NO DIA DATA for week ${semana}!`, 'color: #f59e0b; font-weight: bold');
        }
        console.log('Full response:', rawData);

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
        // Converter string para número e extrair ano se disponível
        let semanaNumero: number;
        let anoNumero: number | null = null;

        if (typeof semana === 'string') {
          if (semana.includes('W')) {
            // Formato: "2025-W45" ou "S2025-W45"
            const anoMatch = semana.match(/(\d{4})/);
            const semanaMatch = semana.match(/W(\d+)/);
            anoNumero = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();
            semanaNumero = semanaMatch ? parseInt(semanaMatch[1], 10) : parseInt(semana, 10);
          } else {
            // Apenas número da semana, usar ano atual
            semanaNumero = parseInt(semana, 10);
            anoNumero = new Date().getFullYear();
          }
        } else {
          semanaNumero = semana;
          anoNumero = new Date().getFullYear();
        }

        // Usar buildFilterPayload para garantir que múltiplas praças sejam tratadas corretamente
        // IMPORTANTE: Não incluir semanas array para evitar duplicação de agregação
        // IMPORTANTE: Sempre passar ano junto com semana para a função RPC funcionar corretamente
        const filters = {
          ano: anoNumero,
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

        try {
          const { data, error } = await safeRpc<UtrData>('calcular_utr', filtro, {
            timeout: 30000,
            validateParams: true
          });

          if (error) {
            console.error(`%c[Comparacao] ❌ Erro ao calcular UTR para semana ${semana}:`, 'color: #ef4444; font-weight: bold', error);
            return { semana, utr: null };
          }

          return { semana, utr: data };
        } catch (err) {
          console.error(`%c[Comparacao] ❌ Exceção ao calcular UTR para semana ${semana}:`, 'color: #ef4444; font-weight: bold', err);
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
            corridasOfertadas: r.dados?.totais?.corridas_ofertadas
          }))
        });
        safeLog.info('🎯 UTR Comparação:', { semanas: resultadosUtr.length });
      }

      // Garantir que os dados estão na ordem correta das semanas selecionadas
      // Como usamos Promise.all no map de semanasSelecionadas, a ordem já está garantida
      const dadosOrdenados = resultadosDados.map(resultado => {
        const defaultData: DashboardResumoData = {
          totais: { corridas_ofertadas: 0, corridas_aceitas: 0, corridas_rejeitadas: 0, corridas_completadas: 0 },
          semanal: [],
          dia: [],
          turno: [],
          sub_praca: [],
          origem: [],
          dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [] }
        };

        const dados = resultado.dados ? { ...defaultData, ...resultado.dados } : defaultData;

        // Garantir que objetos aninhados existam
        if (!dados.totais) dados.totais = defaultData.totais;
        if (!dados.dia) dados.dia = [];
        if (!dados.semanal) dados.semanal = [];
        if (!dados.turno) dados.turno = [];
        if (!dados.sub_praca) dados.sub_praca = [];
        if (!dados.origem) dados.origem = [];

        return dados;
      });

      console.log('%c[Comparacao] 📦 Final processed data:', 'color: #8b5cf6; font-weight: bold');
      console.log('dadosOrdenados length:', dadosOrdenados.length);
      dadosOrdenados.forEach((dados, idx) => {
        console.log(`Week ${semanasSelecionadas[idx]}:`, {
          corridasOfertadas: dados.totais?.corridas_ofertadas,
          diaLength: dados.dia?.length,
          hasDiaData: dados.dia && dados.dia.length > 0
        });
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

