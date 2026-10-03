import type { RpcResult } from '@/types/rpc';
import { fetchInternalRpcApi } from '@/utils/app/fetchInternalRpcApi';

export type DedicadoApiMode = 'summary' | 'entregadores' | 'entregador';

export async function fetchDedicadoApi<T>(
    mode: DedicadoApiMode,
    payload: Record<string, unknown>,
    requestScopeKey?: string
): Promise<RpcResult<T>> {
    return fetchInternalRpcApi<T>({
        path: '/api/dedicado/origens',
        mode,
        payload,
        requestScopeKey,
        errorMessage: 'Erro ao consultar dados do DEDICADO.',
    });
}
