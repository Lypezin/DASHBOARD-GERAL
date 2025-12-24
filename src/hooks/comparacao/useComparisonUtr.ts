import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { createComparisonFilter } from '@/utils/comparacaoHelpers';
import { UtrData, CurrentUser } from '@/types';

export async function fetchComparisonUtr(
    semanasSelecionadas: string[],
    pracaSelecionada: string | null,
    currentUser: CurrentUser | null,
    organizationId: string | null
): Promise<Array<{ semana: string | number; utr: UtrData | null }>> {
    const promessasUtr = semanasSelecionadas.map(async (semana) => {
        const filtro = createComparisonFilter(semana, pracaSelecionada, currentUser, organizationId);

        try {
            const { data, error } = await safeRpc<UtrData>('calcular_utr', filtro, {
                timeout: 30000,
                validateParams: true
            });

            if (error) {
                safeLog.error(`[Comparacao] Erro ao calcular UTR para semana ${semana}:`, error);
                return { semana, utr: null };
            }

            return { semana, utr: data };
        } catch (err) {
            safeLog.error(`[Comparacao] Exceção ao calcular UTR para semana ${semana}:`, err);
            return { semana, utr: null };
        }
    });

    return await Promise.all(promessasUtr);
}
