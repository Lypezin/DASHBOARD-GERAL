import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { UtrData } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchUtrFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface FetchOptions {
    filterPayload: FilterPayload;
}

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Busca dados de UTR
 */
export async function fetchUtrData(options: FetchOptions): Promise<{ data: UtrData | null; error: RpcError | null }> {
    const { filterPayload } = options;

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_turno', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
    const utrPayload: FilterPayload = {};

    for (const key of allowedParams) {
        if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
            utrPayload[key] = filterPayload[key];
        }
    }

    const result = await safeRpc<any>('calcular_utr_completo', utrPayload as any, {
        timeout: RPC_TIMEOUTS.DEFAULT,
        validateParams: true
    });

    if (result.error) {
        const is500 = is500Error(result.error);
        const isRateLimit = isRateLimitError(result.error);

        if (is500) {
            try {
                const fallbackData = await fetchUtrFallback(filterPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar UTR:', fallbackError);
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
                const fallbackData = await fetchUtrFallback(filterPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar UTR:', fallbackError);
            }
        }

        safeLog.error('Erro ao buscar UTR:', result.error);
        return { data: null, error: result.error };
    }

    let utrData: UtrData | null = null;

    let parsedData = result.data;
    if (Array.isArray(parsedData) && parsedData.length > 0) {
        parsedData = parsedData[0];
    }

    if (parsedData && parsedData.calcular_utr_completo) {
        parsedData = parsedData.calcular_utr_completo;
    }

    if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        utrData = parsedData as UtrData;
    } else {
        safeLog.warn('[fetchUtrData] Estrutura de dados inesperada:', result.data);
        utrData = null;
    }

    if (IS_DEV || true) safeLog.info('[UTR Fetcher] Dados recebidos do RPC:', { utrData: result.data });

    return { data: utrData, error: null };
}
