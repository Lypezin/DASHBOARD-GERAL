import { supabase } from '@/lib/supabaseClient';
import type { FilterPayload } from '@/types/filters';

export function buildEntregadoresQuery(safePayload: FilterPayload) {
    let entregadoresQuery = supabase
        .from('dados_corridas')
        .select('id_da_pessoa_entregadora, pessoa_entregadora')
        .not('id_da_pessoa_entregadora', 'is', null);

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

        entregadoresQuery = entregadoresQuery.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
            .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (safePayload.p_ano) {
        const anoInicio = `${safePayload.p_ano}-01-01`;
        const anoFim = `${safePayload.p_ano}-12-31`;
        entregadoresQuery = entregadoresQuery.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (safePayload.p_data_inicial) entregadoresQuery = entregadoresQuery.gte('data_do_periodo', safePayload.p_data_inicial);
    if (safePayload.p_data_final) entregadoresQuery = entregadoresQuery.lte('data_do_periodo', safePayload.p_data_final);

    if (safePayload.p_praca) {
        const pracas = typeof safePayload.p_praca === 'string'
            ? safePayload.p_praca.split(',').map((p: string) => p.trim())
            : [String(safePayload.p_praca).trim()];
        entregadoresQuery = entregadoresQuery.in('praca', pracas);
    }

    if (safePayload.p_sub_praca) {
        const subPracas = typeof safePayload.p_sub_praca === 'string'
            ? safePayload.p_sub_praca.split(',').map((p: string) => p.trim())
            : [String(safePayload.p_sub_praca).trim()];
        entregadoresQuery = entregadoresQuery.in('sub_praca', subPracas);
    }

    if (safePayload.p_origem) {
        const origens = typeof safePayload.p_origem === 'string'
            ? safePayload.p_origem.split(',').map((o: string) => o.trim())
            : [String(safePayload.p_origem).trim()];
        entregadoresQuery = entregadoresQuery.in('origem', origens);
    }

    return entregadoresQuery;
}
