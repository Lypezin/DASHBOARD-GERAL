import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { ValoresEntregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchValoresFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { buildFilterPayload } from './fetcherUtils';
import { fetchValoresDetalhados } from './valoresDetalhadosFetcher';

// Re-export specific fetchers
export { fetchValoresDetalhados } from './valoresDetalhadosFetcher';
export { fetchValoresBreakdown } from './valoresBreakdownFetcher';

interface FetchOptions {
    filterPayload: FilterPayload;
}

/**
 * Busca dados principais de Valores
 */
export async function fetchValoresData(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; error: RpcError | null }> {
    const { filterPayload } = options;

    if (filterPayload.detailed === true) {
        const detailedResult = await fetchValoresDetalhados(options);
        return { data: detailedResult.data, error: detailedResult.error };
    }

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
    const listarValoresPayload = buildFilterPayload(filterPayload, allowedParams);

    const result = await safeRpc<any>('listar_valores_entregadores', listarValoresPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (result.error) {
        const is500 = is500Error(result.error);
        const isRateLimit = isRateLimitError(result.error);

        if (is500) {
            try {
                const fallbackData = await fetchValoresFallback(listarValoresPayload);
                if (fallbackData && fallbackData.length > 0) return { data: fallbackData, error: null };
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
            }
            throw new Error('RETRY_500');
        }

        if (isRateLimit) throw new Error('RETRY_RATE_LIMIT');

        const errorCode = result.error?.code || '';
        const errorMessage = result.error?.message || '';

        if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
            try {
                const fallbackData = await fetchValoresFallback(listarValoresPayload);
                if (fallbackData && fallbackData.length > 0) return { data: fallbackData, error: null };
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
            }

            return {
                data: [],
                error: { message: 'A função de listar valores não está disponível. Entre em contato com o administrador.', code: 'FUNCTION_NOT_FOUND' }
            };
        }

        safeLog.error('Erro ao buscar valores:', result.error);
        return { data: [], error: result.error };
    }

    let processedData: ValoresEntregador[] = [];
    if (result?.data) {
        if (typeof result.data === 'object' && !Array.isArray(result.data)) {
            const dataObj = result.data as { entregadores?: ValoresEntregador[]; valores?: ValoresEntregador[] } | null;
            if (dataObj && 'entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
                processedData = dataObj.entregadores;
            } else if (dataObj && 'valores' in dataObj && Array.isArray(dataObj.valores)) {
                processedData = dataObj.valores;
            } else {
                safeLog.warn('[fetchValoresData] Estrutura inesperada:', dataObj);
            }
        } else if (Array.isArray(result.data)) {
            processedData = result.data;
        }
    }

    return { data: processedData, error: null };
}
