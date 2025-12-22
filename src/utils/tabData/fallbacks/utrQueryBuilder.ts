import { supabase } from '@/lib/supabaseClient';
import { QUERY_LIMITS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';

export const buildUtrQuery = (safePayload: FilterPayload) => {
    let query = supabase
        .from('dados_corridas')
        .select('tempo_disponivel_escalado, numero_de_corridas_aceitas, praca, sub_praca, origem, periodo');

    if (safePayload.p_semana && safePayload.p_ano) {
        const dataInicio = new Date(safePayload.p_ano, 0, 1);
        const diaSemana = dataInicio.getDay();
        const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
        const primeiraSegunda = new Date(dataInicio);
        primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
        const semanaInicio = new Date(primeiraSegunda);
        semanaInicio.setDate(semanaInicio.getDate() + (safePayload.p_semana - 1) * 7);
        const semanaFim = new Date(semanaInicio);
        semanaFim.setDate(semanaFim.getDate() + 6);

        query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
            .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (safePayload.p_ano) {
        const anoInicio = `${safePayload.p_ano}-01-01`;
        const anoFim = `${safePayload.p_ano}-12-31`;
        query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (safePayload.p_data_inicial) {
        query = query.gte('data_do_periodo', safePayload.p_data_inicial);
    }

    if (safePayload.p_data_final) {
        query = query.lte('data_do_periodo', safePayload.p_data_final);
    }

    if (safePayload.p_praca) {
        const pracas = Array.isArray(safePayload.p_praca)
            ? safePayload.p_praca.map((p) => String(p).trim())
            : safePayload.p_praca.split(',').map((p: string) => p.trim());
        if (pracas.length === 1) {
            query = query.eq('praca', pracas[0]);
        } else {
            query = query.in('praca', pracas);
        }
    }

    if (safePayload.p_sub_praca) {
        const subPracas = Array.isArray(safePayload.p_sub_praca)
            ? safePayload.p_sub_praca.map((p) => String(p).trim())
            : safePayload.p_sub_praca.split(',').map((p: string) => p.trim());
        if (subPracas.length === 1) {
            query = query.eq('sub_praca', subPracas[0]);
        } else {
            query = query.in('sub_praca', subPracas);
        }
    }

    if (safePayload.p_origem) {
        const origens = Array.isArray(safePayload.p_origem)
            ? safePayload.p_origem.map((o) => String(o).trim())
            : safePayload.p_origem.split(',').map((o: string) => o.trim());
        if (origens.length === 1) {
            query = query.eq('origem', origens[0]);
        } else {
            query = query.in('origem', origens);
        }
    }

    query = query.limit(QUERY_LIMITS.AGGREGATION_MAX);

    return query;
};
