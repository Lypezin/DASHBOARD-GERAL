import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { QUERY_LIMITS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadoresFallback(
  filtroDataInicio: MarketingDateFilter,
  filtroRodouDia: MarketingDateFilter,
  cidadeSelecionada: string,
  searchTerm: string = ''
): Promise<EntregadorMarketing[]> {
  try {
    // Fallback: buscar entregadores que aparecem em ambas as tabelas
    // OTIMIZAÇÃO: Filtrar dados_marketing PRIMEIRO para reduzir o dataset
    let entregadoresQuery = supabase
      .from('dados_marketing')
      .select('id_entregador, nome, regiao_atuacao, rodando, rodou_dia')
      .not('id_entregador', 'is', null);

    // Aplicar filtro de cidade
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

    // Aplicar filtro de pesquisa (Server-side)
    if (searchTerm) {
      // Pesquisar por nome ou ID
      entregadoresQuery = entregadoresQuery.or(`nome.ilike.%${searchTerm}%,id_entregador.eq.${searchTerm}`);
    }

    // Aplicar filtro de Rodou Dia (usando a coluna rodou_dia da tabela de marketing)
    if (filtroRodouDia.dataInicial) {
      entregadoresQuery = entregadoresQuery.gte('rodou_dia', filtroRodouDia.dataInicial);
    }
    // Não aplicamos lte no rodou_dia para não excluir quem rodou depois (mas também no período)

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

    // OTIMIZAÇÃO: Buscar em lotes PARALELOS para evitar timeout e melhorar performance
    const BATCH_SIZE = 100;
    const todasCorridas: any[] = [];
    const promises = [];

    // NÃO aplicamos filtro de data na query de corridas para poder calcular "Data Inicio" (Primeira Corrida) corretamente.

    for (let i = 0; i < idsEntregadores.length; i += BATCH_SIZE) {
      const batchIds = idsEntregadores.slice(i, i + BATCH_SIZE);

      let corridasQuery = supabase
        .from('dados_corridas')
        .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, data_do_periodo, tempo_disponivel_escalado_segundos')
        .in('id_da_pessoa_entregadora', batchIds);

      // Limitar query para evitar sobrecarga (mas alto o suficiente para pegar histórico)
      corridasQuery = corridasQuery.limit(QUERY_LIMITS.AGGREGATION_MAX);

      promises.push(corridasQuery);
    }

    // Executar queries em paralelo com limite de concorrência para evitar travamentos
    const CONCURRENCY_LIMIT = 3;
    const results = [];

    for (let i = 0; i < promises.length; i += CONCURRENCY_LIMIT) {
      const chunk = promises.slice(i, i + CONCURRENCY_LIMIT);

      if (IS_DEV) {
        safeLog.info(`Processando lote ${Math.floor(i / CONCURRENCY_LIMIT) + 1} de ${Math.ceil(promises.length / CONCURRENCY_LIMIT)}`);
      }

      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);

      if (i + CONCURRENCY_LIMIT < promises.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    for (const result of results) {
      const { data: batchData, error: batchError } = result;
      if (batchError) {
        safeLog.error('Erro ao buscar lote de corridas:', batchError);
        continue;
      }
      if (batchData) {
        todasCorridas.push(...batchData);
      }
    }

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

      const todasCorridasEntregador = corridasPorEntregador.get(entregador.id_entregador) || [];

      // Calcular Primeira Data (Data Inicio) com base em TODO o histórico
      let primeiraData: string | null = null;
      if (todasCorridasEntregador.length > 0) {
        const datasOrdenadas = todasCorridasEntregador
          .map(c => c.data_do_periodo)
          .filter((d): d is string => d != null)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (datasOrdenadas.length > 0) {
          primeiraData = datasOrdenadas[0];
        }
      }

      // Aplicar Filtro de Data Inicio (Primeira Data)
      if (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) {
        if (!primeiraData) continue; // Se não tem data, não entra no filtro

        if (filtroDataInicio.dataInicial && primeiraData < filtroDataInicio.dataInicial) continue;
        if (filtroDataInicio.dataFinal && primeiraData > filtroDataInicio.dataFinal) continue;
      }

      // Filtrar corridas para cálculo de métricas (baseado no Filtro Rodou Dia)
      let corridasParaMetricas = todasCorridasEntregador;

      if (filtroRodouDia.dataInicial || filtroRodouDia.dataFinal) {
        corridasParaMetricas = todasCorridasEntregador.filter(c => {
          if (!c.data_do_periodo) return false;
          if (filtroRodouDia.dataInicial && c.data_do_periodo < filtroRodouDia.dataInicial) return false;
          if (filtroRodouDia.dataFinal && c.data_do_periodo > filtroRodouDia.dataFinal) return false;
          return true;
        });
      }

      // Agregar métricas
      const total_ofertadas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_ofertadas || 0), 0);
      const total_aceitas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_aceitas || 0), 0);
      const total_completadas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_completadas || 0), 0);
      const total_rejeitadas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_rejeitadas || 0), 0);
      const total_segundos = corridasParaMetricas.reduce((sum, c) => sum + (Number(c.tempo_disponivel_escalado_segundos) || 0), 0);

      // Calcular última data e dias sem rodar (usando rodou_dia ou histórico completo)
      let ultimaData: string | null = entregador.rodou_dia || null;

      if (todasCorridasEntregador.length > 0) {
        const datasRecentes = todasCorridasEntregador
          .map(c => c.data_do_periodo)
          .filter((d): d is string => d != null)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (datasRecentes.length > 0) {
          const ultimaCorrida = datasRecentes[0];
          if (ultimaCorrida && (!ultimaData || new Date(ultimaCorrida) > new Date(ultimaData))) {
            ultimaData = ultimaCorrida;
          }
        }
      }

      let diasSemRodar: number | null = null;
      if (ultimaData) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const ultimaDataParts = ultimaData.split('-');
        const ultimaDataObj = new Date(
          Number(ultimaDataParts[0]),
          Number(ultimaDataParts[1]) - 1,
          Number(ultimaDataParts[2])
        );
        const diffTime = hoje.getTime() - ultimaDataObj.getTime();
        diasSemRodar = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      entregadoresComDados.push({
        id_entregador: entregador.id_entregador,
        nome: entregador.nome || 'Nome não informado',
        total_ofertadas,
        total_aceitas,
        total_completadas,
        total_rejeitadas,
        total_segundos,
        ultima_data: ultimaData,
        dias_sem_rodar: diasSemRodar,
        regiao_atuacao: entregador.regiao_atuacao || null,
        rodando: entregador.rodando || null,
      });
    }

    // Ordenar por nome
    entregadoresComDados.sort((a, b) => a.nome.localeCompare(b.nome));

    if (IS_DEV) {
      safeLog.info(`✅ ${entregadoresComDados.length} entregador(es) encontrado(s) (fallback otimizado)`);
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
  fetchEntregadoresFallbackFn: () => Promise<EntregadorMarketing[]>,
  searchTerm: string = ''
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

      // Log detalhado do erro APENAS se não for tratado pelo fallback
      console.error('❌ ERRO CRÍTICO get_entregadores_marketing:', {
        erro: rpcError,
        params: params,
        mensagem: (rpcError as any)?.message,
        codigo: (rpcError as any)?.code,
        detalhes: (rpcError as any)?.details
      });

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
