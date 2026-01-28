
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { QUERY_LIMITS } from '@/constants/config';
import { handleRpcError } from './utils/errorHandling';

// Re-export for compatibility
export * from './fetchEntregadoresDetails';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadores(
  filtroRodouDia: MarketingDateFilter,
  filtroDataInicio: MarketingDateFilter,
  cidadeSelecionada: string,
  organizationId: string | null,
  fetchEntregadoresFallbackFn: () => Promise<EntregadorMarketing[]>,
  searchTerm: string = '',
  limit: number = QUERY_LIMITS.DEFAULT_LIST
): Promise<EntregadorMarketing[]> {
  try {
    if (IS_DEV) safeLog.info('Organization ID obtido:', organizationId);

    // Sanitize organizationId
    if (organizationId === '') organizationId = null;

    // Preparar parâmetros
    const params: any = {
      p_organization_id: organizationId,
      rodou_dia_inicial: filtroRodouDia.dataInicial || null,
      rodou_dia_final: filtroRodouDia.dataFinal || null,
      data_inicio_inicial: filtroDataInicio.dataInicial || null,
      data_inicio_final: filtroDataInicio.dataFinal || null,
      cidade: cidadeSelecionada || null
    };

    const hasMultipleFilters = (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) && cidadeSelecionada;
    const timeoutDuration = hasMultipleFilters ? 60000 : 30000;

    if (IS_DEV) safeLog.info('Chamando get_entregadores_marketing com params:', JSON.stringify(params));

    const { data, error: rpcError } = await safeRpc<EntregadorMarketing[]>('get_entregadores_marketing', params, {
      timeout: timeoutDuration,
      validateParams: false
    });

    if (rpcError) {
      return await handleRpcError(rpcError, params, fetchEntregadoresFallbackFn);
    }

    if (!data || !Array.isArray(data)) {
      if (IS_DEV) safeLog.warn('Dados inválidos retornados:', data);
      return [];
    }

    if (IS_DEV) safeLog.info(`✅ ${data.length} entregador(es) encontrado(s)`);

    return data;
  } catch (err: any) {
    safeLog.error('❌ ERRO GERAL fetchEntregadores:', err);
    safeLog.error('Erro ao buscar entregadores:', err);
    throw err;
  }
}
