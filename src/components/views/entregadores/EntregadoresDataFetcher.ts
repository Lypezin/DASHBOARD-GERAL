import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { QUERY_LIMITS } from '@/constants/config';
import { ensureDateFilter, validateDateFilter } from '@/utils/queryOptimization';

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

    // ⚠️ OTIMIZAÇÃO DISK IO: Garantir filtro de data para evitar scan completo
    // Converter filtro para formato de payload
    const payload = {
      p_data_inicial: filtroDataInicio.dataInicial,
      p_data_final: filtroDataInicio.dataFinal,
    };
    validateDateFilter(payload, 'fetchEntregadoresFallback (Marketing)');
    const safePayload = ensureDateFilter(payload);

    // OTIMIZAÇÃO: Buscar em lotes para evitar atingir o limite de query ou timeout
    const BATCH_SIZE = 50;
    const todasCorridas: any[] = [];

    for (let i = 0; i < idsEntregadores.length; i += BATCH_SIZE) {
      const batchIds = idsEntregadores.slice(i, i + BATCH_SIZE);

      let corridasQuery = supabase
        .from('dados_corridas')
        .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, data_do_periodo')
        .in('id_da_pessoa_entregadora', batchIds);

      // Aplicar filtro de data (usando payload seguro)
      if (safePayload.p_data_inicial) {
        corridasQuery = corridasQuery.gte('data_do_periodo', safePayload.p_data_inicial);
      }
      if (safePayload.p_data_final) {
        corridasQuery = corridasQuery.lte('data_do_periodo', safePayload.p_data_final);
      }

      // Limitar query para evitar sobrecarga, mas alto o suficiente para o lote
      corridasQuery = corridasQuery.limit(QUERY_LIMITS.AGGREGATION_MAX);

      const { data: batchData, error: batchError } = await corridasQuery;

      if (batchError) {
        safeLog.error(`Erro ao buscar lote ${i} de corridas:`, batchError);
        continue; // Tentar próximo lote em vez de falhar tudo
      }

      if (batchData) {
        todasCorridas.push(...batchData);
      }
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
    // Obter organization_id do usuário atual
    const { getCurrentUserOrganizationId } = await import('@/utils/organizationHelpers');
    let organizationId = await getCurrentUserOrganizationId();

    if (IS_DEV) {
      safeLog.info('Organization ID obtido:', organizationId);
    }

    // Sanitize organizationId: convert empty string to null
    if (organizationId === '') {
      organizationId = null;
    }

    // Preparar parâmetros do filtro rodou_dia, data início e cidade
    const params: any = {
      p_organization_id: organizationId, // Já tratado para ser string válida ou null
      rodou_dia_inicial: filtroRodouDia.dataInicial || null,
      rodou_dia_final: filtroRodouDia.dataFinal || null,
      data_inicio_inicial: filtroDataInicio.dataInicial || null,
      data_inicio_final: filtroDataInicio.dataFinal || null,
      cidade: cidadeSelecionada || null
    };

    // Usar função RPC para buscar entregadores com dados agregados
    // Aumentar timeout para 60 segundos quando há múltiplos filtros (data início + cidade)
    const hasMultipleFilters = (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) && cidadeSelecionada;
    const timeoutDuration = hasMultipleFilters ? 60000 : 30000;

    if (IS_DEV) {
      safeLog.info('Chamando get_entregadores_marketing com params:', JSON.stringify(params));
    }

    const { data, error: rpcError } = await safeRpc<EntregadorMarketing[]>('get_entregadores_marketing', params, {
      timeout: timeoutDuration,
      validateParams: false
    });

    if (rpcError) {
      // Log detalhado do erro para debug
      console.error('❌ ERRO CRÍTICO get_entregadores_marketing:', {
        erro: rpcError,
        params: params,
        mensagem: (rpcError as any)?.message,
        codigo: (rpcError as any)?.code,
        detalhes: (rpcError as any)?.details
      });

      // Se a função RPC não existir ou der timeout, fazer fallback para query direta
      const errorCode = (rpcError as any)?.code || '';
      const errorMessage = String((rpcError as any)?.message || '');
      // Detectar erros de função não encontrada - inclui códigos originais E sanitizados
      // rpcWrapper.ts sanitiza erros 400/404 para códigos genéricos ('400', '404')
      const is404 = errorCode === 'PGRST116' || errorCode === '42883' ||
        errorCode === 'PGRST204' || errorCode === 'PGRST203' ||
        errorCode === '400' || errorCode === '404' ||
        errorMessage.includes('404') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('Requisição inválida') ||
        (errorMessage.includes('function') && errorMessage.includes('does not exist'));
      const isTimeout = errorCode === 'TIMEOUT' || errorMessage.includes('timeout') || errorMessage.includes('demorou muito');

      if (is404 || isTimeout) {
        // Função RPC não existe ou deu timeout, usar fallback
        if (IS_DEV) {
          safeLog.warn(`Função RPC get_entregadores_marketing ${isTimeout ? 'deu timeout' : 'não encontrada/erro'}, usando fallback. Erro: ${errorMessage}`);
        }
        return await fetchEntregadoresFallbackFn();
      }

      safeLog.error('Erro RPC get_entregadores_marketing:', rpcError);
      throw rpcError;
    }

    if (!data || !Array.isArray(data)) {
      if (IS_DEV) safeLog.warn('Dados inválidos retornados:', data);
      return [];
    }

    if (IS_DEV) {
      safeLog.info(`✅ ${data.length} entregador(es) encontrado(s)`);
    }

    return data;
  } catch (err: any) {
    console.error('❌ ERRO GERAL fetchEntregadores:', err);
    safeLog.error('Erro ao buscar entregadores:', err);
    throw err;
  }
}

