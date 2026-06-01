import { buildAppAuthHeaders } from './appAuthHeaders';

type ApiErrorShape = {
    error?: string | null;
};

const inFlightGetRequests = new Map<string, Promise<{ data: unknown | null; error: string | null }>>();

export async function getAppApiData<T>(path: string): Promise<{ data: T | null; error: string | null }> {
    const existingRequest = inFlightGetRequests.get(path);

    if (existingRequest) {
        return existingRequest as Promise<{ data: T | null; error: string | null }>;
    }

    const request = (async (): Promise<{ data: T | null; error: string | null }> => {
        const response = await fetch(path, {
            method: 'GET',
            headers: await buildAppAuthHeaders(),
            credentials: 'same-origin',
            cache: 'no-store',
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
    const response = await fetch(path, {
        method: 'POST',
        headers: await buildAppAuthHeaders({
            'Content-Type': 'application/json',
        }),
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(body || {}),
    });

    const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

    if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao enviar dados para API interna.' };
    }

    return { data: (payload?.data ?? null) as T | null, error: null };
}
