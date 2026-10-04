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

interface FetchOptions {
    filterPayload: FilterPayload;
}

export interface ValoresPageData {
    entregadores: ValoresEntregador[];
    total: number;
    total_geral: number;
    total_corridas: number;
    taxa_media_geral: number;
    limit: number;
    offset: number;
    has_more: boolean;
    snapshot: string;
}

export async function fetchValoresPage(options: FetchOptions): Promise<{ data: ValoresPageData | null; error: RpcError | null }> {
    const allowedParams = [
        'p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final',
        'p_organization_id', 'p_limit', 'p_offset', 'p_search', 'p_sort_field', 'p_sort_direction', 'p_snapshot',
        'p_force_full_source',
    ];
    const payload = buildFilterPayload(options.filterPayload, allowedParams, { expandImplicitSingleYear: false });
    if (!('p_limit' in payload)) payload.p_limit = 100;
    if (!('p_offset' in payload)) payload.p_offset = 0;

    const result = await fetchDashboardDataApi<ValoresPageData>('valores_page', payload);
    if (result.error) return { data: null, error: result.error };

    const page = result.data;
    if (
        !page
        || !Array.isArray(page.entregadores)
        || !Number.isFinite(Number(page.total))
        || !Number.isFinite(Number(page.total_geral))
        || !Number.isFinite(Number(page.total_corridas))
        || !Number.isFinite(Number(page.taxa_media_geral))
        || !Number.isInteger(Number(page.limit))
        || Number(page.limit) <= 0
        || !Number.isInteger(Number(page.offset))
        || Number(page.offset) !== Number(payload.p_offset)
        || typeof page.has_more !== 'boolean'
        || typeof page.snapshot !== 'string'
        || page.snapshot.length !== 64
    ) {
        return {
            data: null,
            error: { code: 'INVALID_RESPONSE', message: 'A consulta paginada de valores respondeu em um formato inválido.' },
        };
    }

    return { data: page, error: null };
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

    let parsedData = result.data;
    if (parsedData === null || parsedData === undefined) {
        return {
            data: null,
            error: { code: 'EMPTY_RESPONSE', message: 'A consulta de valores respondeu sem dados.' },
        };
    }

    if (Array.isArray(parsedData) && parsedData.length > 0) {
        // Se for [{ listar_valores_entregadores: ... }] ou [{ entregadores: ... }]
        parsedData = parsedData[0];
    }

    if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData) && 'listar_valores_entregadores' in parsedData) {
        parsedData = (parsedData as { listar_valores_entregadores?: unknown }).listar_valores_entregadores;
    }

    let processedData: ValoresEntregador[];
    if (Array.isArray(parsedData)) {
        processedData = parsedData as ValoresEntregador[];
    } else if (parsedData && typeof parsedData === 'object') {
        const dataObj = parsedData as { entregadores?: ValoresEntregador[]; valores?: ValoresEntregador[] };
        if (Array.isArray(dataObj.entregadores)) {
            processedData = dataObj.entregadores;
        } else if (Array.isArray(dataObj.valores)) {
            processedData = dataObj.valores;
        } else {
            safeLog.warn('[fetchValoresData] Estrutura inesperada:', dataObj);
            return {
                data: null,
                error: { code: 'INVALID_RESPONSE', message: 'A consulta de valores respondeu em um formato inválido.' },
            };
        }
    } else {
        safeLog.warn('[fetchValoresData] Estrutura inesperada:', parsedData);
        return {
            data: null,
            error: { code: 'INVALID_RESPONSE', message: 'A consulta de valores respondeu em um formato inválido.' },
        };
    }

    return { data: normalizeValoresEntregadores(processedData), error: null };
}
