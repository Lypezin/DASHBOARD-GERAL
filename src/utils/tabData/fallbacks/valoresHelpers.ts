
import { supabase } from '@/lib/supabaseClient';
import { FilterPayload } from '@/types/filters';
import { QUERY_LIMITS } from '@/constants/config';
import { ensureDateFilter } from '@/utils/queryOptimization';

export interface ValoresMapItem { id_entregador: string; nome_entregador: string; total_taxas: number; numero_corridas_aceitas: number; }

export function buildValoresQuery(payload: FilterPayload) {
    const safePayload = ensureDateFilter(payload);

    let query = supabase
        .from('dados_corridas')
        .select('id_da_pessoa_entregadora, pessoa_entregadora, soma_das_taxas_das_corridas_aceitas, numero_de_corridas_aceitas, data_do_periodo, praca, sub_praca, origem');

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
        const pracas = typeof safePayload.p_praca === 'string'
            ? safePayload.p_praca.split(',').map((p: string) => p.trim())
            : [String(safePayload.p_praca).trim()];
        if (pracas.length === 1) {
            query = query.eq('praca', pracas[0]);
        } else {
            query = query.in('praca', pracas);
        }
    }

    if (safePayload.p_sub_praca) {
        const subPracas = typeof safePayload.p_sub_praca === 'string'
            ? safePayload.p_sub_praca.split(',').map((p: string) => p.trim())
            : [String(safePayload.p_sub_praca).trim()];
        if (subPracas.length === 1) {
            query = query.eq('sub_praca', subPracas[0]);
        } else {
            query = query.in('sub_praca', subPracas);
        }
    }

    if (safePayload.p_origem) {
        const origens = typeof safePayload.p_origem === 'string'
            ? safePayload.p_origem.split(',').map((o: string) => o.trim())
            : [String(safePayload.p_origem).trim()];
        if (origens.length === 1) {
            query = query.eq('origem', origens[0]);
        } else {
            query = query.in('origem', origens);
        }
    }

    return query.limit(QUERY_LIMITS.AGGREGATION_MAX);
}

export function processValoresData(data: any[]): ValoresMapItem[] {
    const valoresMap = new Map<string, ValoresMapItem>();

    for (const row of data) {
        const id = row.id_da_pessoa_entregadora;
        if (!id) continue;

        const nome = row.pessoa_entregadora || id;
        const taxas = Number(row.soma_das_taxas_das_corridas_aceitas) || 0;
        const corridas = Number(row.numero_de_corridas_aceitas) || 0;

        if (valoresMap.has(id)) {
            const existing = valoresMap.get(id)!;
            existing.total_taxas += taxas;
            existing.numero_corridas_aceitas += corridas;
        } else {
            valoresMap.set(id, { id_entregador: id, nome_entregador: nome, total_taxas: taxas, numero_corridas_aceitas: corridas });
        }
    }

    return Array.from(valoresMap.values());
}
