import { createRequestKey } from '@/utils/request/createRequestKey';

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

const inFlightFluxoRequests = new Map<string, Promise<unknown[]>>();

export async function fetchFluxoSemanal<T = Record<string, unknown>>(
    params: FetchFluxoSemanalParams
): Promise<T[]> {
    const requestKey = createRequestKey(params);
    const existingRequest = inFlightFluxoRequests.get(requestKey);

    if (existingRequest) {
        return existingRequest as Promise<T[]>;
    }

    const request = (async (): Promise<T[]> => {
        const response = await fetch('/api/marketing/fluxo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            cache: 'no-store',
            body: requestKey,
        });

        const payload = await response.json().catch(() => null) as FluxoApiResponse<T> | null;

        if (!response.ok) {
            throw new Error(payload?.error || 'Erro ao consultar fluxo semanal.');
        }

        return Array.isArray(payload?.data) ? payload.data : [];
    })().finally(() => {
        inFlightFluxoRequests.delete(requestKey);
    });

    inFlightFluxoRequests.set(requestKey, request as Promise<unknown[]>);
    return request;
}
