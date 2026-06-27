import { buildAppAuthHeaders } from './appAuthHeaders';
import { INTERNAL_FETCH_OPTIONS, JSON_HEADERS } from './internalFetchOptions';

type ApiErrorShape = {
    error?: string | null;
};

const inFlightGetRequests = new Map<string, Promise<{ data: unknown | null; error: string | null }>>();
const CURRENT_USER_PROFILE_PATH = '/api/app/current-user-profile';

async function sendAppApiData<T>(
    method: 'POST' | 'PATCH',
    path: string,
    body?: Record<string, unknown>,
    options: { keepalive?: boolean } = {}
): Promise<{ data: T | null; error: string | null }> {
    const response = await fetch(path, {
        method,
        ...INTERNAL_FETCH_OPTIONS,
        headers: await buildAppAuthHeaders(JSON_HEADERS),
        keepalive: options.keepalive,
        body: JSON.stringify(body || {}),
    });

    const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

    if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao enviar dados para API interna.' };
    }

    return { data: (payload?.data ?? null) as T | null, error: null };
}

export async function getAppApiData<T>(path: string): Promise<{ data: T | null; error: string | null }> {
    const existingRequest = inFlightGetRequests.get(path);

    if (existingRequest) {
        return existingRequest as Promise<{ data: T | null; error: string | null }>;
    }

    const request = (async (): Promise<{ data: T | null; error: string | null }> => {
        const response = await fetch(path, {
            method: 'GET',
            ...INTERNAL_FETCH_OPTIONS,
            headers: await buildAppAuthHeaders(),
        });

        const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

        if (!response.ok) {
            return { data: null, error: payload?.error || 'Erro ao consultar API interna.' };
        }

        return { data: (payload?.data ?? null) as T | null, error: null };
    })().finally(() => {
        inFlightGetRequests.delete(path);
    });

    inFlightGetRequests.set(path, request as Promise<{ data: unknown | null; error: string | null }>);
    return request;
}

export async function postAppApiData<T>(path: string, body?: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
    return sendAppApiData<T>('POST', path, body);
}

export async function getCurrentUserProfileData<T>(): Promise<{ data: T | null; error: string | null }> {
    return getAppApiData<T>(CURRENT_USER_PROFILE_PATH);
}

export async function patchAppApiData<T>(
    path: string,
    body?: Record<string, unknown>,
    options?: { keepalive?: boolean }
): Promise<{ data: T | null; error: string | null }> {
    return sendAppApiData<T>('PATCH', path, body, options);
}
