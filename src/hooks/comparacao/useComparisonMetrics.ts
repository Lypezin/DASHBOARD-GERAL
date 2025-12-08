import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { createComparisonFilter, parseWeekString } from '@/utils/comparacaoHelpers';
import { DashboardResumoData, CurrentUser } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchComparisonMetrics(
    semanasSelecionadas: string[],
    pracaSelecionada: string | null,
    currentUser: CurrentUser | null
): Promise<DashboardResumoData[]> {
    if (semanasSelecionadas.length < 2) return [];

    const promessasDados = semanasSelecionadas.map(async (semana) => {
        const filtro = createComparisonFilter(semana, pracaSelecionada, currentUser);
        const { semanaNumero, anoNumero } = parseWeekString(semana);

        if (IS_DEV) {
            safeLog.info(`[Comparacao] Buscando dados para semana ${semana} (ano: ${anoNumero}, número: ${semanaNumero})`);
        }

        const { data: rawData, error } = await safeRpc<DashboardResumoData | DashboardResumoData[]>('dashboard_resumo', filtro, {
            timeout: 30000,
            validateParams: true
        });
        if (error) throw error;

        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        return { semana, dados: data as DashboardResumoData };
    });

    const resultadosDados = await Promise.all(promessasDados);

    return resultadosDados.map(resultado => {
        const defaultData: DashboardResumoData = {
            total_ofertadas: 0,
            total_aceitas: 0,
            total_completadas: 0,
            total_rejeitadas: 0,
            aderencia_semanal: [],
            aderencia_dia: [],
            aderencia_turno: [],
            aderencia_sub_praca: [],
            aderencia_origem: [],
            dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [] }
        };
        const dados = resultado.dados ? { ...defaultData, ...resultado.dados } : defaultData;
        return dados;
    });
}
