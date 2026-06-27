import { INTERNAL_FETCH_OPTIONS, JSON_HEADERS } from '@/utils/app/internalFetchOptions';

export interface AdminRpcResult<T = unknown> {
    data: T | null;
    error: any;
}

export async function adminRpc<T = unknown>(
    rpcName: string,
    params: Record<string, unknown> = {}
): Promise<AdminRpcResult<T>> {
    const response = await fetch('/api/admin/rpc', {
        method: 'POST',
        ...INTERNAL_FETCH_OPTIONS,
        headers: JSON_HEADERS,
        body: JSON.stringify({ rpcName, params })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.error) {
        return {
            data: null,
            error: payload?.details || { message: payload?.error || `Erro HTTP ${response.status}` }
        };
    }

    return { data: (payload?.data ?? null) as T, error: null };
}
