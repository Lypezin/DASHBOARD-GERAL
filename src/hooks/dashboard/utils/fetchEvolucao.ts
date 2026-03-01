import { supabase } from '@/lib/supabaseClient';
import type { FilterPayload } from '@/types/filters';
import { safeLog } from '@/lib/errorHandler';

export async function fetchDashboardEvolucaoData(filterPayload: FilterPayload, anoEvolucao: number, activeTab: string) {
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
        safeLog.info('[useDashboardEvolucao] Buscando dados de evolução:', params);
    }

    const [mensalRes, semanalRes, utrRes] = await Promise.all([
        supabase.rpc('dashboard_evolucao_mensal', params),
        supabase.rpc('dashboard_evolucao_semanal', params),
        supabase.rpc('dashboard_utr_semanal', params)
    ]);

    if (process.env.NODE_ENV === 'development') {
        safeLog.info('[useDashboardEvolucao] Dados recebidos:', {
            mensalLength: mensalRes.data?.length,
            semanalLength: semanalRes.data?.length,
            ano: params.p_ano
        });
    }

    if (mensalRes.error) throw mensalRes.error;
    if (semanalRes.error) throw semanalRes.error;
    if (utrRes.error && activeTab === 'utr') throw utrRes.error; // UTR might be optional for other tabs

    return {
        mensalData: mensalRes.data,
        semanalData: semanalRes.data,
        utrData: utrRes.data
    };
}
