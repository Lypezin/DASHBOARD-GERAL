import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { createComparisonFilter, parseWeekString } from '@/utils/comparacaoHelpers';
import { DashboardResumoData, CurrentUser } from '@/types';
import { IS_DEV } from '@/constants/environment';
import { parseDashboardResumoResponse } from '@/utils/dashboard/dashboardResumoValidation';
import type { ComparisonDimensionFilters } from '@/utils/comparacao/filters';


export async function fetchComparisonMetrics(
    semanasSelecionadas: string[],
    pracaSelecionada: string | null,
    currentUser: CurrentUser | null,
    organizationId: string | null,
    selectedYear?: number,
    dimensionFilters?: ComparisonDimensionFilters
): Promise<DashboardResumoData[]> {
    if (semanasSelecionadas.length < 2) return [];

    const promessasDados = semanasSelecionadas.map(async (semana) => {
        const filtro = createComparisonFilter(semana, pracaSelecionada, currentUser, organizationId, selectedYear, dimensionFilters);
        const { semanaNumero, anoNumero } = parseWeekString(semana, selectedYear);

        if (IS_DEV) {
            safeLog.info(`[Comparacao] Buscando semana ${semana}:`, {
                semanaNumero,
                anoNumero,
                selectedYear,
                filtro
            });
        }

        const { data: rawData, error } = await safeRpc<DashboardResumoData | DashboardResumoData[]>('dashboard_resumo', filtro, {
            timeout: 30000,
            validateParams: false
        });

        if (IS_DEV) {
            safeLog.info(`[Comparacao] Resposta semana ${semana}:`, {
                hasError: !!error,
                errorMsg: error?.message,
                rawDataType: Array.isArray(rawData) ? 'array' : typeof rawData,
                rawDataLength: Array.isArray(rawData) ? rawData.length : 'N/A',
                rawDataPreview: rawData
            });
        }

        if (error) throw error;

        const data = parseDashboardResumoResponse(rawData);
        if (!data) {
            throw new Error(`A consulta de resumo da semana ${semana} retornou uma resposta vazia ou inválida.`);
        }
        return { semana, dados: data };
    });

    const resultadosDados = await Promise.all(promessasDados);

    return resultadosDados.map(resultado => {
        return resultado.dados;
    });
}
