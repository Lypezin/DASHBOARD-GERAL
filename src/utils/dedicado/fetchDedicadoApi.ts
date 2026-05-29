import type { RpcResult } from '@/types/rpc';
import { createRequestKey } from '@/utils/request/createRequestKey';

export type DedicadoApiMode = 'summary' | 'entregadores' | 'entregador';

type DedicadoApiResponse<T> = {
    data?: T | null;
    error?: string | null;
};

const inFlightDedicadoRequests = new Map<string, Promise<RpcResult<unknown>>>();

export async function fetchDedicadoApi<T>(
    mode: DedicadoApiMode,
    payload: Record<string, unknown>
): Promise<RpcResult<T>> {
    const requestKey = createRequestKey({ mode, payload });
    const existingRequest = inFlightDedicadoRequests.get(requestKey);

    if (existingRequest) {
        return existingRequest as Promise<RpcResult<T>>;
    }

    const request = (async (): Promise<RpcResult<T>> => {
        const response = await fetch('/api/dedicado/origens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            body: requestKey,
        });

        const result = await response.json().catch(() => null) as DedicadoApiResponse<T> | null;

        if (!response.ok) {
            return {
                data: null,
                error: {
                    message: result?.error || 'Erro ao consultar dados do DEDICADO.',
                },
            };
        }

        return {
            data: (result?.data ?? null) as T | null,
            error: null,
        };
    })().finally(() => {
        inFlightDedicadoRequests.delete(requestKey);
    });

    inFlightDedicadoRequests.set(requestKey, request as Promise<RpcResult<unknown>>);
    return request;
}
