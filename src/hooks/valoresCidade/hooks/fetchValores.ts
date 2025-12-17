import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { MarketingDateFilter } from '@/types';
import { ensureMarketingDateFilter } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchValores(filter: MarketingDateFilter) {
    const safeFilter = ensureMarketingDateFilter(filter);

    if (IS_DEV) {
        safeLog.info('[fetchValores] Buscando dados_valores_cidade com filtro:', {
            dataInicial: safeFilter.dataInicial,
            dataFinal: safeFilter.dataFinal,
        });
    }

    let query = supabase
        .from('dados_valores_cidade')
        .select('cidade, valor');

    if (safeFilter.dataInicial) query = query.gte('data', safeFilter.dataInicial);
    if (safeFilter.dataFinal) query = query.lte('data', safeFilter.dataFinal);

    const { data, error } = await query;

    if (error) {
        throw new Error(`Erro ao buscar dados: ${error.message}`);
    }

    const cidadeMap = new Map<string, number>();

    if (data && data.length > 0) {
        data.forEach((row: any) => {
            const cidade = row.cidade || 'Não especificada';
            const valor = Number(row.valor) || 0;
            cidadeMap.set(cidade, (cidadeMap.get(cidade) || 0) + valor);
        });
    }

    return cidadeMap;
}
