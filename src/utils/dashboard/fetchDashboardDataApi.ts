import type { RpcResult } from '@/types/rpc';
import { fetchInternalRpcApi } from '@/utils/app/fetchInternalRpcApi';

export type DashboardDataApiMode =
    | 'utr'
    | 'entregadores'
    | 'entregadores_page'
    | 'valores'
    | 'valores_page'
    | 'valores_detalhados'
    | 'resumo_local';

export async function fetchDashboardDataApi<T>(
    mode: DashboardDataApiMode,
    payload: Record<string, unknown>
): Promise<RpcResult<T>> {
    return fetchInternalRpcApi<T>({
        path: '/api/dashboard/data',
        mode,
        payload,
        errorMessage: 'Erro ao consultar dados do dashboard.',
    });
}
