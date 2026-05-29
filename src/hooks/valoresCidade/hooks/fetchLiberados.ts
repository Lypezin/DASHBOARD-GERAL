import { supabase } from '@/lib/supabaseClient';
import { MarketingDateFilter } from '@/types';
import { buildDateFilterQuery } from '@/utils/marketingQueries';
import { cidadeToRegiao } from './constants';

export async function fetchLiberadosCount(cidadeNome: string, filterEnviados: MarketingDateFilter) {
    const cidadeUpper = cidadeNome.toUpperCase();
    const regiaoAtuacao = cidadeToRegiao[cidadeUpper] || cidadeNome;

    let liberadosQuery = supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });

    liberadosQuery = buildDateFilterQuery(liberadosQuery, 'data_envio', filterEnviados);
    liberadosQuery = liberadosQuery.eq('status', 'Liberado');

    if (cidadeUpper === 'ABC') {
        liberadosQuery = liberadosQuery.eq('regiao_atuacao', 'ABC 2.0');
    } else {
        liberadosQuery = liberadosQuery.eq('regiao_atuacao', regiaoAtuacao);
    }

    const { count } = await liberadosQuery;
    return count || 0;
}
