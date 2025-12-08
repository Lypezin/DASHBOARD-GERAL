import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { fetchEntregadoresMV } from './helpers/fetchEntregadoresMV';
import { fetchEntregadoresAggregation } from './helpers/fetchEntregadoresAggregation';

export async function fetchEntregadoresFallback(
    filtroDataInicio: MarketingDateFilter,
    filtroRodouDia: MarketingDateFilter,
    cidadeSelecionada: string,
    searchTerm: string = ''
): Promise<EntregadorMarketing[]> {
    try {
        // ESTRATÉGIA HÍBRIDA:
        // 1. Se NÃO tiver filtro de "Data Início" (que exige histórico completo), tentar usar a Materialized View (MV).
        //    A MV já tem os dados agregados e é muito mais rápida.
        // 2. Se tiver filtro de "Data Início" ou a MV falhar, usar o método de agregação otimizado (lento mas preciso).

        const usarMV = !filtroDataInicio.dataInicial && !filtroDataInicio.dataFinal;

        if (usarMV) {
            const mvResult = await fetchEntregadoresMV(filtroRodouDia, cidadeSelecionada, searchTerm);
            if (mvResult) {
                return mvResult;
            }
        }

        // --- FALLBACK LENTO (AGREGAÇÃO OTIMIZADA) ---
        return await fetchEntregadoresAggregation(
            filtroDataInicio,
            filtroRodouDia,
            cidadeSelecionada,
            searchTerm
        );

    } catch (err: any) {
        safeLog.error('Erro no fallback ao buscar entregadores:', err);
        throw err;
    }
}
