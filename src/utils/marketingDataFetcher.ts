import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingTotals, MarketingCityData } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchMarketingTotalsData(
    filters: MarketingFilters, 
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<MarketingTotals> {
    const defaultStart = null;
    const defaultEnd = null;

    const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        criado: number; enviado: number; liberado: number; rodando_inicio: number;
        aberto: number; voltou: number;
    }>>('get_marketing_totals', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || defaultStart,
        data_envio_final: filters.filtroEnviados.dataFinal || defaultEnd,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || defaultStart,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || defaultEnd,
        rodou_dia_inicial: filters.filtroRodouDia.dataInicial || defaultStart,
        rodou_dia_final: filters.filtroRodouDia.dataFinal || defaultEnd,
        p_organization_id: organizationId,
    }, { validateParams: false, client });

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const d = rpcData[0];
        return { 
            criado: d.criado || 0, 
            enviado: d.enviado || 0, 
            liberado: d.liberado || 0, 
            rodandoInicio: d.rodando_inicio || 0,
            aberto: d.aberto || 0,
            voltou: d.voltou || 0
        };
    }

    if (IS_DEV) safeLog.warn('RPC get_marketing_totals fetch fallback');

    // Base query com organização
    const baseQuery = client.from('dados_marketing').select('*', { count: 'exact', head: true });
    if (organizationId) baseQuery.eq('organization_id', organizationId);

    const { count: abertoCount } = await client.from('dados_marketing').select('*', { count: 'exact', head: true })
        .eq('status', 'Aberto')
        .match(organizationId ? { organization_id: organizationId } : {});
        
    const { count: voltouCount } = await client.from('dados_marketing').select('*', { count: 'exact', head: true })
        .eq('status', 'Voltou')
        .match(organizationId ? { organization_id: organizationId } : {});

    const { count: criadoCount } = await client.from('dados_marketing').select('*', { count: 'exact', head: true })
        .not('data_envio', 'is', null)
        .match(organizationId ? { organization_id: organizationId } : {});

    let enviadoQuery = client.from('dados_marketing').select('*', { count: 'exact', head: true })
        .match(organizationId ? { organization_id: organizationId } : {});
    if (filters.filtroEnviados.dataInicial) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
    const { count: enviadoCount } = await enviadoQuery;

    let liberadoQuery = client.from('dados_marketing').select('*', { count: 'exact', head: true })
        .match(organizationId ? { organization_id: organizationId } : {});
    if (filters.filtroLiberacao.dataInicial) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
    const { count: liberadoCount } = await liberadoQuery;

    let rodandoQuery = client.from('dados_marketing').select('*', { count: 'exact', head: true })
        .match(organizationId ? { organization_id: organizationId } : {});
    if (filters.filtroRodouDia.dataInicial) rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);
    const { count: rodandoCount } = await rodandoQuery;

    return { 
        criado: criadoCount || 0, 
        enviado: enviadoCount || 0, 
        liberado: liberadoCount || 0, 
        rodandoInicio: rodandoCount || 0,
        aberto: abertoCount || 0,
        voltou: voltouCount || 0
    };
}

export async function fetchMarketingCitiesData(
    filters: MarketingFilters, 
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<MarketingCityData[]> {
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
    }, { validateParams: false, client });

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
        let enviadoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {});
        if (filters.filtroEnviados.dataInicial) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);

        let liberadoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {});
        if (filters.filtroLiberacao.dataInicial) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);

        let rodandoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {});
        if (filters.filtroRodouDia.dataInicial) rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);

        const [e, l, r] = await Promise.all([enviadoQuery, liberadoQuery, rodandoQuery]);
        results.push({ cidade, enviado: e.count || 0, liberado: l.count || 0, rodandoInicio: r.count || 0 });
    }
    return results;
}
