import { safeLog } from '@/lib/errorHandler';
import { is500Error, isRateLimitError, isTimeoutError } from '@/lib/rpcErrorHandler';
import { ValoresEntregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { buildFilterPayload } from './fetcherUtils';
import { fetchValoresDetalhados } from './valoresDetalhadosFetcher';
import { fetchDashboardDataApi } from '@/utils/dashboard/fetchDashboardDataApi';
import { normalizeValoresEntregadores } from '@/utils/valores/normalizeValoresEntregadores';

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
    // Preservar p_ano ativa o caminho agregado rapido do RPC. Expandir o ano
    // para datas fazia a consulta cair no caminho legado e atingir o timeout.
    const listarValoresPayload = buildFilterPayload(filterPayload, allowedParams, {
        expandImplicitSingleYear: false,
    });

    const result = await fetchDashboardDataApi<any>('valores', listarValoresPayload);

    if (result.error) {
        const is500 = is500Error(result.error);
        const isRateLimit = isRateLimitError(result.error);
        const isTimeout = isTimeoutError(result.error);

        if (is500 || isTimeout) {
            throw new Error('RETRY_500');
        }

        if (isRateLimit) throw new Error('RETRY_RATE_LIMIT');

        const errorCode = result.error?.code || '';
        const errorMessage = result.error?.message || '';

        if (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist')) {
            return { data: [], error: { message: 'A função não está disponível.', code: 'FUNCTION_NOT_FOUND' } };
        }

        safeLog.error('Erro ao buscar valores:', result.error);
        return { data: [], error: result.error };
    }

    let processedData: ValoresEntregador[] = [];
    if (result?.data) {
        let parsedData = result.data;
        if (Array.isArray(parsedData) && parsedData.length > 0) {
            // Se for [{ listar_valores_entregadores: ... }] ou [{ entregadores: ... }]
            parsedData = parsedData[0];
        }

        if (parsedData && parsedData.listar_valores_entregadores) {
            parsedData = parsedData.listar_valores_entregadores;
        }

        if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
            const dataObj = parsedData as { entregadores?: ValoresEntregador[]; valores?: ValoresEntregador[] } | null;
            if (dataObj && 'entregadores' in dataObj && Array.isArray(dataObj.entregadores)) {
                processedData = dataObj.entregadores;
            } else if (dataObj && 'valores' in dataObj && Array.isArray(dataObj.valores)) {
                processedData = dataObj.valores;
            } else {
                safeLog.warn('[fetchValoresData] Estrutura inesperada:', dataObj);
            }
        } else if (Array.isArray(parsedData)) {
            processedData = parsedData as ValoresEntregador[];
        }
    }

    return { data: normalizeValoresEntregadores(processedData), error: null };
}
