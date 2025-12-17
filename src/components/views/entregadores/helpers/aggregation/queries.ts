import { supabase } from '@/lib/supabaseClient';
import { MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { QUERY_LIMITS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadoresIds(
    cidadeSelecionada: string,
    searchTerm: string,
    filtroRodouDia: MarketingDateFilter
) {
    let entregadoresQuery = supabase
        .from('dados_marketing')
        .select('id_entregador, nome, regiao_atuacao, rodando, rodou_dia')
        .not('id_entregador', 'is', null);

    if (cidadeSelecionada) {
        if (cidadeSelecionada === 'Santo André') {
            entregadoresQuery = entregadoresQuery
                .eq('regiao_atuacao', 'ABC 2.0')
                .in('sub_praca_abc', ['Vila Aquino', 'São Caetano']);
        } else if (cidadeSelecionada === 'São Bernardo') {
            entregadoresQuery = entregadoresQuery
                .eq('regiao_atuacao', 'ABC 2.0')
                .in('sub_praca_abc', ['Diadema', 'Nova petrópolis', 'Rudge Ramos']);
        } else {
            entregadoresQuery = entregadoresQuery.eq('regiao_atuacao', cidadeSelecionada);
        }
    }

    if (searchTerm) {
        entregadoresQuery = entregadoresQuery.or(`nome.ilike.%${searchTerm}%,id_entregador.eq.${searchTerm}`);
    }

    if (filtroRodouDia.dataInicial) {
        entregadoresQuery = entregadoresQuery.gte('rodou_dia', filtroRodouDia.dataInicial);
    }

    const { data, error } = await entregadoresQuery;
    if (error) throw error;
    return data || [];
}

export async function fetchCorridasBatch(ids: string[]) {
    // Parallel batches
    const BATCH_SIZE = 100;
    const promises = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        let corridasQuery = supabase
            .from('dados_corridas')
            .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, data_do_periodo, tempo_disponivel_escalado_segundos')
            .in('id_da_pessoa_entregadora', batchIds)
            .limit(QUERY_LIMITS.AGGREGATION_MAX);

        promises.push(corridasQuery);
    }

    const CONCURRENCY_LIMIT = 3;
    const results = [];

    for (let i = 0; i < promises.length; i += CONCURRENCY_LIMIT) {
        const chunk = promises.slice(i, i + CONCURRENCY_LIMIT);
        if (IS_DEV) safeLog.info(`Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}`);
        results.push(...await Promise.all(chunk));
        if (i + CONCURRENCY_LIMIT < promises.length) await new Promise(r => setTimeout(r, 50));
    }

    const todasCorridas: any[] = [];
    results.forEach(({ data, error }) => {
        if (error) safeLog.error('Error fetching corridas batch:', error);
        else if (data) todasCorridas.push(...data);
    });

    return todasCorridas;
}
