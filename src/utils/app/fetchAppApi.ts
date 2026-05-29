type ApiErrorShape = {
    error?: string | null;
};

export async function getAppApiData<T>(path: string): Promise<{ data: T | null; error: string | null }> {
    const response = await fetch(path, {
        method: 'GET',
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

    if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao consultar API interna.' };
    }

    return { data: (payload?.data ?? null) as T | null, error: null };
}

export async function postAppApiData<T>(path: string, body?: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(body || {}),
    });

    const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

    if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao enviar dados para API interna.' };
    }

    return { data: (payload?.data ?? null) as T | null, error: null };
}
