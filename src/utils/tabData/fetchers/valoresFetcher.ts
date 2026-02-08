import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { ValoresEntregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchValoresFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { buildFilterPayload } from './fetcherUtils';

interface FetchOptions {
    filterPayload: FilterPayload;
}

/**
 * Busca dados de Valores
 */
export async function fetchValoresData(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; error: RpcError | null }> {
    const { filterPayload } = options;

    // Check if we need detailed data
    const isDetailed = filterPayload.detailed === true;

    if (isDetailed) {
        // Use detailed RPC logic (which wraps the result in { entregadores: ..., total: ... })
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
                if (fallbackData && fallbackData.length > 0) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
            }
            throw new Error('RETRY_500');
        }

        if (isRateLimit) {
            throw new Error('RETRY_RATE_LIMIT');
        }

        const errorCode = result.error?.code || '';
        const errorMessage = result.error?.message || '';

        if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
            try {
                const fallbackData = await fetchValoresFallback(listarValoresPayload);
                if (fallbackData && fallbackData.length > 0) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar valores:', fallbackError);
            }

            return {
                data: [],
                error: {
                    message: 'A função de listar valores não está disponível. Entre em contato com o administrador.',
                    code: 'FUNCTION_NOT_FOUND'
                }
            };
        }

        safeLog.error('Erro ao buscar valores:', result.error);
        return { data: [], error: result.error };
    }

    let processedData: ValoresEntregador[] = [];

    if (result && result.data !== null && result.data !== undefined) {
        if (typeof result.data === 'object' && !Array.isArray(result.data)) {
            const dataObj = result.data as { entregadores?: ValoresEntregador[]; valores?: ValoresEntregador[] } | null;

            if (dataObj && 'entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
                processedData = dataObj.entregadores;
            } else if (dataObj && 'valores' in dataObj && Array.isArray(dataObj.valores)) {
                processedData = dataObj.valores;
            } else {
                safeLog.warn('[fetchValoresData] Estrutura de dados inesperada:', dataObj);
                processedData = [];
            }
        } else if (Array.isArray(result.data)) {
            processedData = result.data;
        }
    }

    return { data: processedData, error: null };
}

/**
 * Busca dados detalhados de Valores (com turno e sub)
 */
export async function fetchValoresDetalhados(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; total: number; error: RpcError | null }> {
    const { filterPayload } = options;

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_limit', 'p_offset'];
    const listarValoresPayload = buildFilterPayload(filterPayload, allowedParams);

    // Default defaults if not provided (handled by RPC usually but good for explicit intent)
    if (!('p_limit' in listarValoresPayload)) listarValoresPayload['p_limit'] = 25;
    if (!('p_offset' in listarValoresPayload)) listarValoresPayload['p_offset'] = 0;

    const result = await safeRpc<any>('listar_valores_entregadores_detalhado', listarValoresPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (result.error) {
        safeLog.error('Erro ao buscar valores detalhados:', result.error);
        return { data: [], total: 0, error: result.error };
    }

    let processedData: ValoresEntregador[] = [];
    let total = 0;

    if (result && result.data !== null && result.data !== undefined) {
        if (typeof result.data === 'object' && !Array.isArray(result.data)) {
            const dataObj = result.data as any;
            if (dataObj && 'entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
                processedData = dataObj.entregadores;
            }
            if (dataObj && 'total' in dataObj) {
                total = Number(dataObj.total) || 0;
            }
        } else if (Array.isArray(result.data)) {
            // Fallback for unexpected structure
            processedData = result.data;
            total = result.data.length;
        }
    }

    return { data: processedData, total, error: null };
}

/**
 * Busca breakdown de valores (Turno/Sub)
 */
import { ValoresBreakdown } from '@/types/financeiro';

export async function fetchValoresBreakdown(options: FetchOptions): Promise<{ data: ValoresBreakdown | null; error: RpcError | null }> {
    const { filterPayload } = options;

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
    const breakdownPayload = buildFilterPayload(filterPayload, allowedParams);

    const result = await safeRpc<ValoresBreakdown>('obter_resumo_valores_breakdown', breakdownPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (result.error) {
        safeLog.error('Erro ao buscar breakdown de valores:', result.error);
        return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
}
