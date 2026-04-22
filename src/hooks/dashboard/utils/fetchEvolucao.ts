import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
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

export async function fetchDashboardEvolucaoData(
    filterPayload: FilterPayload,
    anoEvolucao: number,
    activeTab: string
): Promise<DashboardEvolucaoDataResult> {
    const params = {
        p_ano: anoEvolucao,
        p_organization_id: filterPayload.p_organization_id,
        p_praca: filterPayload.p_praca,
        p_sub_praca: filterPayload.p_sub_praca,
        p_origem: filterPayload.p_origem,
        p_turno: filterPayload.p_turno,
        p_sub_pracas: filterPayload.p_sub_pracas,
        p_origens: filterPayload.p_origens,
        p_turnos: filterPayload.p_turnos,
    };

    if (process.env.NODE_ENV === 'development') {
        safeLog.info('[useDashboardEvolucao] Buscando dados de evolucao:', params);
    }

    const { data: bundleData, error: bundleError } = await safeRpc<DashboardEvolucaoBundle>(
        'dashboard_evolucao_bundle',
        params,
        { validateParams: false }
    );

    if (!bundleError && bundleData) {
        const mensalData = normalizeArray(bundleData.mensal);
        const semanalData = normalizeArray(bundleData.semanal);
        const utrData = normalizeArray(bundleData.utr);

        if (process.env.NODE_ENV === 'development') {
            safeLog.info('[useDashboardEvolucao] Dados recebidos via bundle:', {
                mensalLength: mensalData.length,
                semanalLength: semanalData.length,
                utrLength: utrData.length,
                ano: params.p_ano
            });
        }

        return { mensalData, semanalData, utrData };
    }

    safeLog.warn('[useDashboardEvolucao] Bundle indisponivel, usando fallback legado:', bundleError);

    const [mensalRes, semanalRes, utrRes] = await Promise.all([
        supabase.rpc('dashboard_evolucao_mensal', params),
        supabase.rpc('dashboard_evolucao_semanal', params),
        supabase.rpc('dashboard_utr_semanal', params)
    ]);

    if (process.env.NODE_ENV === 'development') {
        safeLog.info('[useDashboardEvolucao] Dados recebidos via fallback:', {
            mensalLength: mensalRes.data?.length,
            semanalLength: semanalRes.data?.length,
            utrLength: utrRes.data?.length,
            ano: params.p_ano
        });
    }

    if (mensalRes.error) throw mensalRes.error;
    if (semanalRes.error) throw semanalRes.error;
    if (utrRes.error && activeTab === 'utr') throw utrRes.error;

    return {
        mensalData: normalizeArray(mensalRes.data),
        semanalData: normalizeArray(semanalRes.data),
        utrData: normalizeArray(utrRes.data)
    };
}
