import { safeLog } from '@/lib/errorHandler';
import { is500Error, isTimeoutError } from '@/lib/rpcErrorHandler';
import { ValoresBreakdown } from '@/types/financeiro';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { buildFilterPayload } from './fetcherUtils';
import { fetchDashboardDataApi } from '@/utils/dashboard/fetchDashboardDataApi';

export interface FetchOptions {
    filterPayload: FilterPayload;
}

/**
 * Busca breakdown de valores (Turno/Sub)
 */
export async function fetchValoresBreakdown(options: FetchOptions): Promise<{ data: ValoresBreakdown | null; error: RpcError | null }> {
    const { filterPayload } = options;

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
    const breakdownPayload = buildFilterPayload(filterPayload, allowedParams);

    const result = await fetchDashboardDataApi<ValoresBreakdown>('valores_breakdown', breakdownPayload);

    if (result.error) {
        if (is500Error(result.error) || isTimeoutError(result.error)) {
            return { data: null, error: null };
        }

        safeLog.error('Erro ao buscar breakdown de valores:', result.error);
        return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
}
