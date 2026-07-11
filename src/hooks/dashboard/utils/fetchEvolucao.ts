import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { IS_DEV } from '@/constants/environment';
import type { FilterPayload } from '@/types/filters';
import type { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';

interface DashboardEvolucaoBundle {
    mensal?: EvolucaoMensal[];
    semanal?: EvolucaoSemanal[];
    utr?: UtrSemanal[];
}

function normalizeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

export interface DashboardEvolucaoDataResult {
    mensalData: EvolucaoMensal[];
    semanalData: EvolucaoSemanal[];
    utrData: UtrSemanal[];
}

function hasValues(value: unknown) {
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function canUseOrgYearFastPath(filterPayload: FilterPayload) {
    return !hasValues(filterPayload.p_praca)
        && !hasValues(filterPayload.p_sub_praca)
        && !hasValues(filterPayload.p_origem)
        && !hasValues(filterPayload.p_turno)
        && !hasValues(filterPayload.p_sub_pracas)
        && !hasValues(filterPayload.p_origens)
        && !hasValues(filterPayload.p_turnos)
        && !hasValues(filterPayload.p_data_inicial)
        && !hasValues(filterPayload.p_data_final)
        && !hasValues(filterPayload.p_semana)
        && !hasValues(filterPayload.p_semanas)
        && Boolean(filterPayload.p_organization_id);
}

export async function fetchDashboardEvolucaoData(
    filterPayload: FilterPayload,
    anoEvolucao: number,
    _activeTab: string
): Promise<DashboardEvolucaoDataResult> {
    const useFastPath = canUseOrgYearFastPath(filterPayload);
    const params = useFastPath ? {
        p_ano: anoEvolucao,
        p_organization_id: filterPayload.p_organization_id,
    } : {
        p_ano: anoEvolucao,
        p_organization_id: filterPayload.p_organization_id,
        p_semana: filterPayload.p_semana,
        p_semanas: filterPayload.p_semanas,
        p_praca: filterPayload.p_praca,
        p_sub_praca: filterPayload.p_sub_praca,
        p_origem: filterPayload.p_origem,
        p_turno: filterPayload.p_turno,
        p_sub_pracas: filterPayload.p_sub_pracas,
        p_origens: filterPayload.p_origens,
        p_turnos: filterPayload.p_turnos,
        p_filtro_modo: filterPayload.p_filtro_modo,
        p_data_inicial: filterPayload.p_data_inicial,
        p_data_final: filterPayload.p_data_final,
    };
    const functionName = useFastPath ? 'dashboard_evolucao_bundle_org_year_fast' : 'dashboard_evolucao_bundle';

    if (IS_DEV) {
        safeLog.info('[useDashboardEvolucao] Buscando dados de evolucao:', params);
    }

    const { data: bundleData, error: bundleError } = await safeRpc<DashboardEvolucaoBundle>(
        functionName,
        params,
        { validateParams: false }
    );

    if (!bundleError && bundleData) {
        const mensalData = normalizeArray(bundleData.mensal);
        const semanalData = normalizeArray(bundleData.semanal);
        const utrData = normalizeArray(bundleData.utr);

        if (IS_DEV) {
            safeLog.info('[useDashboardEvolucao] Dados recebidos via bundle:', {
                mensalLength: mensalData.length,
                semanalLength: semanalData.length,
                utrLength: utrData.length,
                ano: params.p_ano
            });
        }

        return { mensalData, semanalData, utrData };
    }

    safeLog.error('[useDashboardEvolucao] Bundle indisponivel:', bundleError);
    throw new Error(bundleError?.message || 'Erro ao carregar dados consolidados de evolucao');
}
