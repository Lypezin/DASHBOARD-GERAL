import type { RpcResult } from '@/types/rpc';
import { createRequestKey } from '@/utils/request/createRequestKey';

type InternalRpcApiResponse<T> = {
    data?: T | null;
    error?: string | null;
};

const inFlightInternalRpcRequests = new Map<string, Promise<RpcResult<unknown>>>();

interface FetchInternalRpcApiOptions {
    path: string;
    mode: string;
    payload: Record<string, unknown>;
    errorMessage: string;
}

export async function fetchInternalRpcApi<T>({
    path,
    mode,
    payload,
    errorMessage,
}: FetchInternalRpcApiOptions): Promise<RpcResult<T>> {
    const requestKey = createRequestKey({ path, mode, payload });
    const existingRequest = inFlightInternalRpcRequests.get(requestKey);

    if (existingRequest) {
        return existingRequest as Promise<RpcResult<T>>;
    }

    const request = (async (): Promise<RpcResult<T>> => {
        const body = createRequestKey({ mode, payload });
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            body,
        });

        const result = await response.json().catch(() => null) as InternalRpcApiResponse<T> | null;

        if (!response.ok) {
            return {
                data: null,
                error: {
                    message: result?.error || errorMessage,
                },
            };
        }

        return {
            data: (result?.data ?? null) as T | null,
            error: null,
        };
    })().finally(() => {
        inFlightInternalRpcRequests.delete(requestKey);
    });

    inFlightInternalRpcRequests.set(requestKey, request as Promise<RpcResult<unknown>>);
    return request;
}
