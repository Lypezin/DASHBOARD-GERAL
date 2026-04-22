import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { fetchEntregadoresAggregation } from './helpers/fetchEntregadoresAggregation';

export async function fetchEntregadoresFallback(
    filtroDataInicio: MarketingDateFilter,
    filtroRodouDia: MarketingDateFilter,
    cidadeSelecionada: string,
    searchTerm: string = '',
    organizationId: string | null = null
): Promise<EntregadorMarketing[]> {
    try {
        return await fetchEntregadoresAggregation(
            filtroDataInicio,
            filtroRodouDia,
            cidadeSelecionada,
            searchTerm,
            organizationId
        );
    } catch (err: unknown) {
        safeLog.error('Erro no fallback ao buscar entregadores:', err);
        throw err;
    }
}
