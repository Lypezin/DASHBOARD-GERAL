import { INTERNAL_FETCH_OPTIONS, JSON_HEADERS } from '@/utils/app/internalFetchOptions';

type UploadApiErrorShape = {
    code?: string;
    error?: string | null;
    message?: string | null;
};

export async function postUploadApi<T>(
    path: string,
    body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; payload: (T & UploadApiErrorShape) | null }> {
    const response = await fetch(path, {
        method: 'POST',
        ...INTERNAL_FETCH_OPTIONS,
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null) as (T & UploadApiErrorShape) | null;

    return {
        ok: response.ok,
        status: response.status,
        payload,
    };
}
