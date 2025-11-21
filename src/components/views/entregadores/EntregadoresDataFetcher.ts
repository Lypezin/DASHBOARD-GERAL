import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { QUERY_LIMITS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadoresFallback(
  filtroDataInicio: MarketingDateFilter,
  cidadeSelecionada: string
): Promise<EntregadorMarketing[]> {
  try {
    // Fallback: buscar entregadores que aparecem em ambas as tabelas
    // Primeiro, buscar IDs únicos de entregadores do marketing
    let entregadoresQuery = supabase
      .from('dados_marketing')
      .select('id_entregador, nome, regiao_atuacao')
      .not('id_entregador', 'is', null);

    // Aplicar filtro de cidade se especificado
    if (cidadeSelecionada) {
      if (cidadeSelecionada === 'Santo André') {
        entregadoresQuery = entregadoresQuery
          .eq('regiao_atuacao', 'ABC 2.0')
          .in('sub_praca_abc', ['Vila Aquino', 'São Caetano']);
      } else if (cidadeSelecionada === 'São Bernardo') {
        entregadoresQuery = entregadoresQuery
          .eq('regiao_atuacao', 'ABC 2.0')
          .in('sub_praca_abc', ['Diadema', 'Nova petrópolis', 'Rudge Ramos']);
      } else {
        entregadoresQuery = entregadoresQuery.eq('regiao_atuacao', cidadeSelecionada);
      }
    }

    const { data: entregadoresIds, error: idsError } = await entregadoresQuery;

    if (idsError) throw idsError;

    if (!entregadoresIds || entregadoresIds.length === 0) {
      return [];
    }

    // OTIMIZAÇÃO: Buscar todos os dados de uma vez ao invés de loop N+1
    const idsEntregadores = entregadoresIds
      .map(e => e.id_entregador)
      .filter((id): id is string => !!id);

    if (idsEntregadores.length === 0) {
      return [];
    }

    // Buscar todas as corridas de uma vez para todos os entregadores
    let corridasQuery = supabase
      .from('dados_corridas')
      .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, data_do_periodo')
      .in('id_da_pessoa_entregadora', idsEntregadores);

    // Aplicar filtro de data início se especificado
    if (filtroDataInicio.dataInicial) {
      corridasQuery = corridasQuery.gte('data_do_periodo', filtroDataInicio.dataInicial);
    }
    if (filtroDataInicio.dataFinal) {
      corridasQuery = corridasQuery.lte('data_do_periodo', filtroDataInicio.dataFinal);
    }

    // Limitar query para evitar sobrecarga
    corridasQuery = corridasQuery.limit(QUERY_LIMITS.AGGREGATION_MAX);

    const { data: todasCorridas, error: corridasError } = await corridasQuery;

    if (corridasError) {
      throw corridasError;
    }

    // Criar mapa de entregadores para lookup rápido
    const entregadoresMap = new Map(entregadoresIds.map(e => [e.id_entregador, e]));

    // Agregar dados por entregador em memória
    const corridasPorEntregador = new Map<string, typeof todasCorridas>();
    
    if (todasCorridas) {
      for (const corrida of todasCorridas) {
        const id = corrida.id_da_pessoa_entregadora;
        if (!id) continue;

        if (!corridasPorEntregador.has(id)) {
          corridasPorEntregador.set(id, []);
        }
        corridasPorEntregador.get(id)!.push(corrida);
      }
    }

    // Processar cada entregador
    const entregadoresComDados: EntregadorMarketing[] = [];

    for (const entregador of entregadoresIds) {
      if (!entregador.id_entregador) continue;

      const corridasData = corridasPorEntregador.get(entregador.id_entregador) || [];

      // Se não há corridas, pular este entregador
      if (corridasData.length === 0) {
        continue;
      }

      // Aplicar filtro de data início se especificado - verificar primeira data
      if (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) {
        const primeiraData = corridasData
          .map(c => c.data_do_periodo)
          .filter((d): d is string => d != null)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

        if (!primeiraData) {
          continue;
        }

        const dataInicio = filtroDataInicio.dataInicial;
        const dataFim = filtroDataInicio.dataFinal;
        
        if (dataInicio && primeiraData < dataInicio) {
          continue;
        }
        if (dataFim && primeiraData > dataFim) {
          continue;
        }
      }

      // Agregar dados
      const total_ofertadas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_ofertadas || 0), 0);
      const total_aceitas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_aceitas || 0), 0);
      const total_completadas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_completadas || 0), 0);
      const total_rejeitadas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_rejeitadas || 0), 0);

      // Calcular última data e dias sem rodar
      let ultimaData: string | null = null;
      let diasSemRodar: number | null = null;
      
      if (corridasData.length > 0) {
        const datas = corridasData
          .map(c => c.data_do_periodo)
          .filter((d): d is string => d != null)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        if (datas.length > 0) {
          ultimaData = datas[0];
          if (ultimaData) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const ultimaDataObj = new Date(ultimaData);
            ultimaDataObj.setHours(0, 0, 0, 0);
            const diffTime = hoje.getTime() - ultimaDataObj.getTime();
            diasSemRodar = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }
      }

      entregadoresComDados.push({
        id_entregador: entregador.id_entregador,
        nome: entregador.nome || 'Nome não informado',
        total_ofertadas,
        total_aceitas,
        total_completadas,
        total_rejeitadas,
        total_segundos: 0, // Fallback não calcula horas
        ultima_data: ultimaData,
        dias_sem_rodar: diasSemRodar,
        regiao_atuacao: entregador.regiao_atuacao || null,
      });
    }

    // Ordenar por nome
    entregadoresComDados.sort((a, b) => a.nome.localeCompare(b.nome));

    if (IS_DEV) {
      safeLog.info(`✅ ${entregadoresComDados.length} entregador(es) encontrado(s) (fallback)`);
    }

    return entregadoresComDados;
  } catch (err: any) {
    safeLog.error('Erro no fallback ao buscar entregadores:', err);
    throw err;
  }
}

export async function fetchEntregadores(
  filtroRodouDia: MarketingDateFilter,
  filtroDataInicio: MarketingDateFilter,
  cidadeSelecionada: string,
  fetchEntregadoresFallbackFn: () => Promise<EntregadorMarketing[]>
): Promise<EntregadorMarketing[]> {
  try {
    // Preparar parâmetros do filtro rodou_dia, data início e cidade
    const params: any = {};
    
    if (filtroRodouDia.dataInicial || filtroRodouDia.dataFinal) {
      params.rodou_dia_inicial = filtroRodouDia.dataInicial || null;
      params.rodou_dia_final = filtroRodouDia.dataFinal || null;
    }
    
    if (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) {
      params.data_inicio_inicial = filtroDataInicio.dataInicial || null;
      params.data_inicio_final = filtroDataInicio.dataFinal || null;
    }
    
    if (cidadeSelecionada) {
      params.cidade = cidadeSelecionada;
    }
    
    // Sempre passar um objeto, mesmo que vazio, para evitar problemas com undefined
    const finalParams = params;

    // Usar função RPC para buscar entregadores com dados agregados
    // Aumentar timeout para 60 segundos quando há múltiplos filtros (data início + cidade)
    const hasMultipleFilters = (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) && cidadeSelecionada;
    const timeoutDuration = hasMultipleFilters ? 60000 : 30000;
    
    const { data, error: rpcError } = await safeRpc<EntregadorMarketing[]>('get_entregadores_marketing', finalParams, {
      timeout: timeoutDuration,
      validateParams: false
    });

    if (rpcError) {
      // Se a função RPC não existir ou der timeout, fazer fallback para query direta
      const errorCode = (rpcError as any)?.code || '';
      const errorMessage = String((rpcError as any)?.message || '');
      const is404 = errorCode === 'PGRST116' || errorCode === '42883' || 
                    errorCode === 'PGRST204' ||
                    errorMessage.includes('404') || 
                    errorMessage.includes('not found');
      const isTimeout = errorCode === 'TIMEOUT' || errorMessage.includes('timeout') || errorMessage.includes('demorou muito');

      if (is404 || isTimeout) {
        // Função RPC não existe ou deu timeout, usar fallback
        if (IS_DEV) {
          safeLog.warn(`Função RPC get_entregadores_marketing ${isTimeout ? 'deu timeout' : 'não encontrada'}, usando fallback`);
        }
        return await fetchEntregadoresFallbackFn();
      }
      
      throw rpcError;
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    if (IS_DEV) {
      safeLog.info(`✅ ${data.length} entregador(es) encontrado(s)`);
    }

    return data;
  } catch (err: any) {
    safeLog.error('Erro ao buscar entregadores:', err);
    throw err;
  }
}

