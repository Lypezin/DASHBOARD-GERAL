export interface FetchFluxoSemanalParams {
    dataFinal: string;
    dataInicial: string;
    includeNames?: boolean;
    organizationId: string;
    praca?: string | null;
}

type FluxoApiResponse<T> = {
    data?: T[];
    error?: string | null;
};

export async function fetchFluxoSemanal<T = Record<string, unknown>>(
    params: FetchFluxoSemanalParams
): Promise<T[]> {
    const response = await fetch('/api/marketing/fluxo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(params),
    });

    const payload = await response.json().catch(() => null) as FluxoApiResponse<T> | null;

    if (!response.ok) {
        throw new Error(payload?.error || 'Erro ao consultar fluxo semanal.');
    }

    return Array.isArray(payload?.data) ? payload.data : [];
}
