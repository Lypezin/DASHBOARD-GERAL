import { supabase } from '@/lib/supabaseClient';
import { MarketingDateFilter } from '@/types';
import { buildDateFilterQuery } from '@/utils/marketingQueries';
import { SANTO_ANDRE_SUB_PRACAS, SAO_BERNARDO_SUB_PRACAS } from '@/constants/marketing';

export async function fetchLiberadosCount(
    atendenteNome: string,
    filtroEnviadosLiberados: MarketingDateFilter,
    cidade?: string
) {
    let query = supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });

    query = buildDateFilterQuery(query, 'data_envio', filtroEnviadosLiberados);
    query = query.eq('status', 'Liberado');
    query = query.eq('responsavel', atendenteNome);

    if (cidade) {
        if (cidade === 'ABC' || cidade === 'ABC 2.0') {
            query = query.eq('regiao_atuacao', 'ABC 2.0');
        } else if (cidade === 'Santo André') {
            query = query
                .eq('regiao_atuacao', 'ABC 2.0')
                .in('sub_praca_abc', SANTO_ANDRE_SUB_PRACAS);
        } else if (cidade === 'São Bernardo') {
            query = query
                .eq('regiao_atuacao', 'ABC 2.0')
                .in('sub_praca_abc', SAO_BERNARDO_SUB_PRACAS);
        } else {
            query = query.eq('regiao_atuacao', cidade);
        }
    }

    const { count } = await query;
    return count || 0;
}
