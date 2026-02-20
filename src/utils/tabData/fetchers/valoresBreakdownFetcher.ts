import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { ValoresBreakdown } from '@/types/financeiro';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { buildFilterPayload } from './fetcherUtils';

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
