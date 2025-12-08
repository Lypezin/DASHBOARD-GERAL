import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { EntregadoresData, Entregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchEntregadoresFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface FetchOptions {
    filterPayload: FilterPayload;
}

/**
 * Busca dados de Entregadores
 */
export async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    const { filterPayload } = options;

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
    const listarEntregadoresPayload: FilterPayload = {};

    for (const key of allowedParams) {
        if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
            listarEntregadoresPayload[key] = filterPayload[key];
        }
    }

    const result = await safeRpc<any>('listar_entregadores_v2', listarEntregadoresPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (result.error) {
        const is500 = is500Error(result.error);
        const isRateLimit = isRateLimitError(result.error);

        if (is500) {
            try {
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData && fallbackData.entregadores.length > 0) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
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
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
            }
        }

        safeLog.error('Erro ao buscar entregadores:', result.error);
        return { data: { entregadores: [], total: 0 }, error: result.error };
    }

    let processedData: EntregadoresData = { entregadores: [], total: 0 };

    if (result && result.data) {
        let entregadores: Record<string, unknown>[] = [];
        let total = 0;

        if (typeof result.data === 'object' && !Array.isArray(result.data)) {
            if ('entregadores' in result.data && Array.isArray(result.data.entregadores)) {
                entregadores = result.data.entregadores;
                total = result.data.total !== undefined ? result.data.total : result.data.entregadores.length;
            } else {
                safeLog.warn('[fetchEntregadoresData] Estrutura de dados inesperada:', result.data);
                entregadores = [];
                total = 0;
            }
        } else if (Array.isArray(result.data)) {
            entregadores = result.data;
            total = result.data.length;
        }

        processedData = { entregadores: entregadores as unknown as Entregador[], total };
    }

    return { data: processedData, error: null };
}
