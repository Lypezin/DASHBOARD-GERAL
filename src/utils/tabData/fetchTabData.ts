import { fetchUtrData, fetchEntregadoresData, fetchValoresData } from '@/utils/tabData/fetchers';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

interface FetchOptions {
    tab: string;
    filterPayload: FilterPayload;
    onRetry?: (attempt: number) => void;
}

/**
 * Busca dados baseado no tipo de tab
 */
export async function fetchTabData(options: FetchOptions): Promise<{ data: TabData; error: RpcError | null }> {
    const { tab, filterPayload } = options;

    try {
        switch (tab) {
            case 'dashboard':
                return { data: null, error: null };

            case 'utr':
                return await fetchUtrData({ filterPayload });

            case 'entregadores':
                return await fetchEntregadoresData({ filterPayload });

            case 'valores':
                return await fetchValoresData({ filterPayload });

            case 'prioridade':
                return await fetchEntregadoresData({ filterPayload });

            default:
                return { data: null, error: new Error(`Tab desconhecida: ${tab}`) };
        }
    } catch (error) {
        const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : '';
        if (errorMessage === 'RETRY_500' || errorMessage === 'RETRY_RATE_LIMIT') {
            throw error;
        }
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
