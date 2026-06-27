import type { RpcResult } from '@/types/rpc';
import { fetchInternalRpcApi } from '@/utils/app/fetchInternalRpcApi';

export type DedicadoApiMode = 'summary' | 'entregadores' | 'entregador';

export async function fetchDedicadoApi<T>(
    mode: DedicadoApiMode,
    payload: Record<string, unknown>
): Promise<RpcResult<T>> {
    return fetchInternalRpcApi<T>({
        path: '/api/dedicado/origens',
        mode,
        payload,
        errorMessage: 'Erro ao consultar dados do DEDICADO.',
    });
}
