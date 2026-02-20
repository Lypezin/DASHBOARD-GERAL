import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { ValoresEntregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { buildFilterPayload } from './fetcherUtils';

export interface FetchOptions {
    filterPayload: FilterPayload;
}

/**
 * Busca dados detalhados de Valores (com turno e sub)
 */
export async function fetchValoresDetalhados(options: FetchOptions): Promise<{ data: ValoresEntregador[] | null; total: number; error: RpcError | null }> {
    const { filterPayload } = options;

    const allowedParams = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_limit', 'p_offset'];
    const listarValoresPayload = buildFilterPayload(filterPayload, allowedParams);

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
            processedData = result.data;
            total = result.data.length;
        }
    }

    return { data: processedData, total, error: null };
}
