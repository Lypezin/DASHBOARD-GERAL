import type { RpcResult } from '@/types/rpc';
import { createRequestKey } from '@/utils/request/createRequestKey';

export type DashboardDataApiMode =
    | 'utr'
    | 'entregadores'
    | 'valores'
    | 'valores_detalhados'
    | 'valores_breakdown'
    | 'resumo_local';

type DashboardDataApiResponse<T> = {
    data?: T | null;
    error?: string | null;
};

const inFlightDashboardRequests = new Map<string, Promise<RpcResult<unknown>>>();

export async function fetchDashboardDataApi<T>(
    mode: DashboardDataApiMode,
    payload: Record<string, unknown>
): Promise<RpcResult<T>> {
    const requestKey = createRequestKey({ mode, payload });
    const existingRequest = inFlightDashboardRequests.get(requestKey);

    if (existingRequest) {
        return existingRequest as Promise<RpcResult<T>>;
    }

    const request = (async (): Promise<RpcResult<T>> => {
        const response = await fetch('/api/dashboard/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            body: requestKey,
        });

        const result = await response.json().catch(() => null) as DashboardDataApiResponse<T> | null;

        if (!response.ok) {
            return {
                data: null,
                error: {
                    message: result?.error || 'Erro ao consultar dados do dashboard.',
                },
            };
        }

        return {
            data: (result?.data ?? null) as T | null,
            error: null,
        };
    })().finally(() => {
        inFlightDashboardRequests.delete(requestKey);
    });

    inFlightDashboardRequests.set(requestKey, request as Promise<RpcResult<unknown>>);
    return request;
}
