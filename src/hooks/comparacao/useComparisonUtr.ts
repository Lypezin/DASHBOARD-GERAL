import { safeLog } from '@/lib/errorHandler';
import { createComparisonFilter } from '@/utils/comparacaoHelpers';
import { UtrData, CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchUtrData } from '@/utils/tabData/fetchers/utrFetcher';
import { extractUtrValue } from '@/utils/utr/extractUtrValue';
import { getSafeErrorMessage } from '@/lib/errorHandler';

type ComparisonUtrItem = { semana: string | number; utr: UtrData | null };

type ComparisonUtrResult = {
    data: ComparisonUtrItem[];
    error: string | null;
};

export async function fetchComparisonUtr(
    semanasSelecionadas: string[],
    pracaSelecionada: string | null,
    currentUser: CurrentUser | null,
    organizationId: string | null,
    selectedYear?: number
): Promise<ComparisonUtrResult> {
    const errors: string[] = [];
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
                errors.push(`Semana ${semana}: ${getSafeErrorMessage(error)}`);
                return { semana, utr: null };
            }

            const normalizedData = data && extractUtrValue(data) !== null ? data : null;
            return { semana, utr: normalizedData };
        } catch (err) {
            safeLog.error(`[Comparacao] Excecao ao calcular UTR para semana ${semana}:`, err);
            errors.push(`Semana ${semana}: ${getSafeErrorMessage(err)}`);
            return { semana, utr: null };
        }
    });

    const data = await Promise.all(promessasUtr);
    return {
        data,
        error: errors.length > 0 ? errors.join(' · ') : null,
    };
}
