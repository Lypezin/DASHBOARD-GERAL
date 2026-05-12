import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError, isTimeoutError } from '@/lib/rpcErrorHandler';
import { EntregadoresData, Entregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchEntregadoresFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface FetchOptions {
    filterPayload: FilterPayload;
}

function parseEntregadoresResponse(resultData: unknown): EntregadoresData {
    const processedData: EntregadoresData = { entregadores: [], total: 0 };

    if (!resultData) return processedData;

    let entregadores: Record<string, unknown>[] = [];
    let total = 0;

    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
        const dataObject = resultData as Record<string, unknown>;
        if (Array.isArray(dataObject.entregadores)) {
            entregadores = dataObject.entregadores as Record<string, unknown>[];
            total = dataObject.total !== undefined ? Number(dataObject.total) : dataObject.entregadores.length;
            processedData.periodo_resolvido = dataObject.periodo_resolvido as EntregadoresData['periodo_resolvido'];
        } else {
            safeLog.warn('[fetchEntregadoresData] Estrutura de dados inesperada:', resultData);
        }
    } else if (Array.isArray(resultData)) {
        entregadores = resultData;
        total = resultData.length;
    }

    return {
        ...processedData,
        entregadores: entregadores as unknown as Entregador[],
        total: Number.isFinite(total) ? total : entregadores.length
    };
}

async function fetchEntregadoresByRpc(
    rpcName: 'listar_entregadores_v2' | 'listar_entregadores_origens' | 'listar_entregadores_origens_v2',
    filterPayload: FilterPayload,
    options: { fallbackOnError: boolean }
): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    const isDedicadoRpc = rpcName === 'listar_entregadores_origens' || rpcName === 'listar_entregadores_origens_v2';
    const allowedParams = isDedicadoRpc
        ? ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_data_inicial', 'p_data_final', 'p_organization_id']
        : ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_only_dedicados'];
    const listarEntregadoresPayload: FilterPayload = {};

    for (const key of allowedParams) {
        if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
            listarEntregadoresPayload[key] = filterPayload[key];
        }
    }

    const result = await safeRpc<any>(rpcName, listarEntregadoresPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (result.error) {
        const is500 = is500Error(result.error);
        const isRateLimit = isRateLimitError(result.error);
        const isTimeout = isTimeoutError(result.error);

        if ((is500 || isTimeout) && options.fallbackOnError) {
            try {
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
            }
        }

        if (is500 && options.fallbackOnError) {
            throw new Error('RETRY_500');
        }

        if (isRateLimit) {
            throw new Error('RETRY_RATE_LIMIT');
        }

        if (isTimeout) {
            return { data: { entregadores: [], total: 0 }, error: result.error };
        }

        const errorCode = result.error?.code || '';
        const errorMessage = result.error?.message || '';

        if (options.fallbackOnError && (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist'))) {
            try {
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
            }
        }

        safeLog.error(`Erro ao buscar entregadores via ${rpcName}:`, result.error);
        return { data: { entregadores: [], total: 0 }, error: result.error };
    }

    return { data: parseEntregadoresResponse(result.data), error: null };
}

/**
 * Busca dados de Entregadores
 */
export async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    return fetchEntregadoresByRpc('listar_entregadores_v2', options.filterPayload, { fallbackOnError: true });
}

/**
 * Busca dados da subguia DEDICADO, mantendo apenas entregadores com origem/restaurante.
 */
export async function fetchDedicadoEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    const result = await fetchEntregadoresByRpc('listar_entregadores_origens_v2', options.filterPayload, { fallbackOnError: false });
    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';

    if (errorCode === '42883' || errorCode === 'PGRST202' || errorMessage.includes('listar_entregadores_origens_v2')) {
        const legacyPayload = { ...options.filterPayload };
        delete legacyPayload.p_semanas;
        return fetchEntregadoresByRpc('listar_entregadores_origens', legacyPayload, { fallbackOnError: false });
    }

    return result;
}
