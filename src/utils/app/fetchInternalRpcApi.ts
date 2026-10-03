import type { RpcResult } from '@/types/rpc';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { INTERNAL_FETCH_OPTIONS, JSON_HEADERS } from './internalFetchOptions';

type InternalRpcApiResponse<T> = {
    data?: T | null;
    error?: string | null;
    code?: string | null;
    details?: string | null;
};

const inFlightInternalRpcRequests = new Map<string, Promise<RpcResult<unknown>>>();

interface FetchInternalRpcApiOptions {
    path: string;
    mode: string;
    payload: Record<string, unknown>;
    errorMessage: string;
    requestScopeKey?: string;
}

export async function fetchInternalRpcApi<T>({
    path,
    mode,
    payload,
    errorMessage,
    requestScopeKey,
}: FetchInternalRpcApiOptions): Promise<RpcResult<T>> {
    const requestKey = createRequestKey({ path, mode, payload, requestScopeKey: requestScopeKey || null });
    const existingRequest = inFlightInternalRpcRequests.get(requestKey);

    if (existingRequest) {
        return existingRequest as Promise<RpcResult<T>>;
    }

    const request = (async (): Promise<RpcResult<T>> => {
        const body = createRequestKey({ mode, payload });
        const response = await fetch(path, {
            method: 'POST',
            ...INTERNAL_FETCH_OPTIONS,
            headers: JSON_HEADERS,
            body,
        });

        const result = await response.json().catch(() => null) as InternalRpcApiResponse<T> | null;

        if (!response.ok) {
            return {
                data: null,
                error: {
                    message: result?.error || errorMessage,
                    status: response.status,
                    code: result?.code || undefined,
                    details: result?.details || undefined,
                },
            };
        }

        if (!result || typeof result !== 'object' || !Object.prototype.hasOwnProperty.call(result, 'data')) {
            return {
                data: null,
                error: {
                    message: 'A API interna retornou uma resposta vazia ou inválida.',
                    status: response.status,
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
