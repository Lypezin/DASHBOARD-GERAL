import { safeLog } from '@/lib/errorHandler';
import { createComparisonFilter } from '@/utils/comparacaoHelpers';
import { UtrData, CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchUtrData } from '@/utils/tabData/fetchers/utrFetcher';
import { createEmptyUtrData, extractUtrValue } from '@/utils/utr/extractUtrValue';

export async function fetchComparisonUtr(
    semanasSelecionadas: string[],
    pracaSelecionada: string | null,
    currentUser: CurrentUser | null,
    organizationId: string | null,
    selectedYear?: number
): Promise<Array<{ semana: string | number; utr: UtrData | null }>> {
    const promessasUtr = semanasSelecionadas.map(async (semana) => {
        const filtro = createComparisonFilter(
            semana,
            pracaSelecionada,
            currentUser,
            organizationId,
            selectedYear
        ) as FilterPayload;

        try {
            const { data, error } = await fetchUtrData({ filterPayload: filtro });

            if (error) {
                safeLog.error(`[Comparacao] Erro ao calcular UTR para semana ${semana}:`, error);
                return { semana, utr: createEmptyUtrData() };
            }

            const normalizedData = data && extractUtrValue(data) !== null ? data : createEmptyUtrData();
            return { semana, utr: normalizedData };
        } catch (err) {
            safeLog.error(`[Comparacao] Excecao ao calcular UTR para semana ${semana}:`, err);
            return { semana, utr: createEmptyUtrData() };
        }
    });

    return await Promise.all(promessasUtr);
}
