import type { RpcResult } from '@/types/rpc';
import { fetchInternalRpcApi } from '@/utils/app/fetchInternalRpcApi';

export type DashboardDataApiMode =
    | 'utr'
    | 'entregadores'
    | 'valores'
    | 'valores_detalhados'
    | 'valores_breakdown'
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
