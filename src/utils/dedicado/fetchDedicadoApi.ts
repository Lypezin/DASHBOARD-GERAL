import type { RpcResult } from '@/types/rpc';

export type DedicadoApiMode = 'summary' | 'entregadores' | 'entregador';

type DedicadoApiResponse<T> = {
    data?: T | null;
    error?: string | null;
};

export async function fetchDedicadoApi<T>(
    mode: DedicadoApiMode,
    payload: Record<string, unknown>
): Promise<RpcResult<T>> {
    const response = await fetch('/api/dedicado/origens', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({ mode, payload }),
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
}
