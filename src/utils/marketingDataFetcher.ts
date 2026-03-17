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
            return { 
                cidade, 
                enviado: item?.enviado || 0, 
                liberado: item?.liberado || 0, 
                rodandoInicio: item?.rodando_inicio || 0,
                aberto: 0, // RPC ainda não retorna individualmente
                voltou: 0  // RPC ainda não retorna individualmente
            };
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

        let abertoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .eq('status', 'Aberto')
            .match(organizationId ? { organization_id: organizationId } : {});

        let voltouQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .eq('status', 'Voltou')
            .match(organizationId ? { organization_id: organizationId } : {});

        const [e, l, r, a, v] = await Promise.all([enviadoQuery, liberadoQuery, rodandoQuery, abertoQuery, voltouQuery]);
        results.push({ 
            cidade, 
            enviado: e.count || 0, 
            liberado: l.count || 0, 
            rodandoInicio: r.count || 0,
            aberto: a.count || 0,
            voltou: v.count || 0
        });
    }
    return results;
}

export async function fetchMarketingDailyEvolution(
    filters: MarketingFilters,
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<Array<{ data: string; liberado: number; enviado: number }>> {
    // Busca evolução diária baseada no filtro de liberados ou enviados
    let query = client
        .from('dados_marketing')
        .select('data_liberacao, data_envio')
        .match(organizationId ? { organization_id: organizationId } : {});

    // Aplicar filtros de data se existirem
    const dateFilter = filters.filtroEnviados.dataInicial ? filters.filtroEnviados : 
                      filters.filtroLiberacao.dataInicial ? filters.filtroLiberacao : null;

    if (dateFilter) {
        if (dateFilter.dataInicial) query = query.or(`data_envio.gte.${dateFilter.dataInicial},data_liberacao.gte.${dateFilter.dataInicial}`);
        if (dateFilter.dataFinal) query = query.or(`data_envio.lte.${dateFilter.dataFinal},data_liberacao.lte.${dateFilter.dataFinal}`);
    }

    const { data, error } = await query;

    if (error) {
        safeLog.error('Erro ao buscar evolução diária:', error);
        return [];
    }

    const dailyMap = new Map<string, { data: string; liberado: number; enviado: number }>();

    data.forEach(item => {
        if (item.data_liberacao) {
            const d = item.data_liberacao;
            const existing = dailyMap.get(d) || { data: d, liberado: 0, enviado: 0 };
            existing.liberado++;
            dailyMap.set(d, existing);
        }
        if (item.data_envio) {
            const d = item.data_envio;
            const existing = dailyMap.get(d) || { data: d, liberado: 0, enviado: 0 };
            existing.enviado++;
            dailyMap.set(d, existing);
        }
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.data.localeCompare(b.data));
}

export async function fetchMarketingWeeklyComparison(
    organizationId: string | null,
    city: string | null = null,
    referenceDate: string | null = null,
    client: SupabaseClient = supabase
): Promise<Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>> {
    const targetDate = referenceDate ? new Date(referenceDate) : new Date();
    
    // Função auxiliar para calcular número da semana aproximado (ISO-ish)
    const getWeekKey = (d: Date) => {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        // Ajusta para quinta-feira da mesma semana (lógica ISO)
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const startOfYear = new Date(date.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((date.getTime() - startOfYear.getTime()) / 86400000 - 3 + (startOfYear.getDay() + 6) % 7) / 7);
        return `Semana ${weekNum.toString().padStart(2, '0')}`;
    };

    // Gera as 8 semanas-alvo (da mais antiga para a mais atual)
    const weekMap = new Map<string, { semana: string; criado: number; enviado: number; liberado: number; rodando: number }>();
    const order: string[] = [];
    
    // Pega a data de referência e volta 7 semanas
    for (let i = 7; i >= 0; i--) {
        const d = new Date(targetDate.getTime());
        d.setDate(d.getDate() - (i * 7));
        const key = getWeekKey(d);
        order.push(key);
        weekMap.set(key, { semana: key, criado: 0, enviado: 0, liberado: 0, rodando: 0 });
    }

    // Busca dados no Supabase limitando pelo período (90 dias de margem para garantir)
    const startDate = new Date(targetDate.getTime());
    startDate.setDate(startDate.getDate() - 90);
    
    let query = client.from('dados_marketing').select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', targetDate.toISOString());

    if (organizationId) query = query.eq('organization_id', organizationId);
    if (city) query = buildCityQuery(query, city);

    const { data, error } = await query;
    if (error) return order.map(key => weekMap.get(key)!);

    data.forEach(item => {
        // Usa a data mais relevante disponível para classificar a semana
        const dateStr = item.data_envio || item.data_liberacao || item.created_at;
        if (!dateStr) return;
        
        const weekKey = getWeekKey(new Date(dateStr));
        if (weekMap.has(weekKey)) {
            const w = weekMap.get(weekKey)!;
            w.criado++;
            if (item.data_envio) w.enviado++;
            if (item.data_liberacao) w.liberado++;
            if (item.rodando === 'Sim') w.rodando++;
        }
    });

    // Retorna na ordem cronológica gerada
    return order.map(key => weekMap.get(key)!);
}
