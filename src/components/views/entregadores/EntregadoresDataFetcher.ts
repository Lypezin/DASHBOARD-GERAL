import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { QUERY_LIMITS } from '@/constants/config';
import { fetchEntregadoresFallback } from './EntregadoresFallbackFetcher';

const IS_DEV = process.env.NODE_ENV === 'development';



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
