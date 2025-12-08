import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingTotals, MarketingCityData } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchMarketingTotalsData(filters: MarketingFilters, organizationId: string | null): Promise<MarketingTotals> {
    const defaultStart = null;
    const defaultEnd = null;

    const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        criado: number; enviado: number; liberado: number; rodando_inicio: number;
    }>>('get_marketing_totals', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || defaultStart,
        data_envio_final: filters.filtroEnviados.dataFinal || defaultEnd,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || defaultStart,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || defaultEnd,
        rodou_dia_inicial: filters.filtroRodouDia.dataInicial || defaultStart,
        rodou_dia_final: filters.filtroRodouDia.dataFinal || defaultEnd,
        p_organization_id: organizationId,
    }, { validateParams: false });

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const d = rpcData[0];
        return { criado: d.criado || 0, enviado: d.enviado || 0, liberado: d.liberado || 0, rodandoInicio: d.rodando_inicio || 0 };
    }

    if (IS_DEV) safeLog.warn('RPC get_marketing_totals fetch fallback');

    const { count: criadoCount } = await supabase.from('dados_marketing').select('*', { count: 'exact', head: true }).not('data_envio', 'is', null);

    let enviadoQuery = supabase.from('dados_marketing').select('*', { count: 'exact', head: true });
    if (filters.filtroEnviados.dataInicial) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
    else if (defaultStart && defaultEnd) enviadoQuery = enviadoQuery.gte('data_envio', defaultStart).lte('data_envio', defaultEnd);
    const { count: enviadoCount } = await enviadoQuery;

    let liberadoQuery = supabase.from('dados_marketing').select('*', { count: 'exact', head: true });
    if (filters.filtroLiberacao.dataInicial) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
    else if (defaultStart && defaultEnd) liberadoQuery = liberadoQuery.gte('data_liberacao', defaultStart).lte('data_liberacao', defaultEnd);
    const { count: liberadoCount } = await liberadoQuery;

    let rodandoQuery = supabase.from('dados_marketing').select('*', { count: 'exact', head: true });
    if (filters.filtroRodouDia.dataInicial) rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);
    else if (defaultStart && defaultEnd) rodandoQuery = rodandoQuery.gte('rodou_dia', defaultStart).lte('rodou_dia', defaultEnd);
    const { count: rodandoCount } = await rodandoQuery;

    return { criado: criadoCount || 0, enviado: enviadoCount || 0, liberado: liberadoCount || 0, rodandoInicio: rodandoCount || 0 };
}

export async function fetchMarketingCitiesData(filters: MarketingFilters, organizationId: string | null): Promise<MarketingCityData[]> {
    const defaultStart = null;
    const defaultEnd = null;

    const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        cidade: string; enviado: number; liberado: number; rodando_inicio: number;
    }>>('get_marketing_cities_data', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || defaultStart,
        data_envio_final: filters.filtroEnviados.dataFinal || defaultEnd,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || defaultStart,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || defaultEnd,
        rodou_dia_inicial: filters.filtroRodouDia.dataInicial || defaultStart,
        rodou_dia_final: filters.filtroRodouDia.dataFinal || defaultEnd,
        p_organization_id: organizationId,
    }, { validateParams: false });

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
        const rpcMap = new Map(rpcData.map(item => [item.cidade, item]));
        return CIDADES.map(cidade => {
            const item = rpcMap.get(cidade);
            return { cidade, enviado: item?.enviado || 0, liberado: item?.liberado || 0, rodandoInicio: item?.rodando_inicio || 0 };
        });
    }

    if (IS_DEV) safeLog.warn('RPC get_marketing_cities_data fetch fallback');

    const results: MarketingCityData[] = [];
    for (const cidade of CIDADES) {
        let enviadoQuery = buildCityQuery(supabase.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade);
        if (filters.filtroEnviados.dataInicial) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);

        let liberadoQuery = buildCityQuery(supabase.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade);
        if (filters.filtroLiberacao.dataInicial) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);

        let rodandoQuery = buildCityQuery(supabase.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade);
        if (filters.filtroRodouDia.dataInicial) rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);

        const [e, l, r] = await Promise.all([enviadoQuery, liberadoQuery, rodandoQuery]);
        results.push({ cidade, enviado: e.count || 0, liberado: l.count || 0, rodandoInicio: r.count || 0 });
    }
    return results;
}
