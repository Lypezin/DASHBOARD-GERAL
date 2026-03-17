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
): Promise<Array<{ data: string; liberado: number; enviado: number; rodando: number }>> {
    // Busca evolução diária baseada nos filtros ativos
    let query = client
        .from('dados_marketing')
        .select('data_liberacao, data_envio, rodou_dia')
        .match(organizationId ? { organization_id: organizationId } : {});

    // Aplicar filtros de data se existirem. 
    // Como os filtros estão unificados na apresentação, podemos ser abrangentes.
    const hasFilters = filters.filtroEnviados.dataInicial || filters.filtroLiberacao.dataInicial || filters.filtroRodouDia.dataInicial;

    if (hasFilters) {
        const conds: string[] = [];
        if (filters.filtroEnviados.dataInicial) {
            conds.push(`data_envio.gte.${filters.filtroEnviados.dataInicial}`);
            if (filters.filtroEnviados.dataFinal) conds.push(`data_envio.lte.${filters.filtroEnviados.dataFinal}`);
        }
        if (filters.filtroLiberacao.dataInicial) {
            conds.push(`data_liberacao.gte.${filters.filtroLiberacao.dataInicial}`);
            if (filters.filtroLiberacao.dataFinal) conds.push(`data_liberacao.lte.${filters.filtroLiberacao.dataFinal}`);
        }
        if (filters.filtroRodouDia.dataInicial) {
            conds.push(`rodou_dia.gte.${filters.filtroRodouDia.dataInicial}`);
            if (filters.filtroRodouDia.dataFinal) conds.push(`rodou_dia.lte.${filters.filtroRodouDia.dataFinal}`);
        }

        if (conds.length > 0) {
            query = query.or(conds.join(','));
        }
    }

    const { data, error } = await query;

    if (error) {
        safeLog.error('Erro ao buscar evolução diária:', error);
        return [];
    }

    const dailyMap = new Map<string, { data: string; liberado: number; enviado: number; rodando: number }>();

    data.forEach(item => {
        const processDate = (d: string | null, type: 'liberado' | 'enviado' | 'rodando') => {
            if (!d) return;
            const existing = dailyMap.get(d) || { data: d, liberado: 0, enviado: 0, rodando: 0 };
            existing[type]++;
            dailyMap.set(d, existing);
        };

        processDate(item.data_liberacao, 'liberado');
        processDate(item.data_envio, 'enviado');
        processDate(item.rodou_dia, 'rodando');
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
    
    // Função auxiliar para calcular número da semana (Sunday Start - O padrão do usuário)
    const getWeekKey = (d: Date) => {
        const year = d.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
        const weekNum = Math.floor((dayOfYear + startOfYear.getDay()) / 7) + 1;
        return `Semana ${weekNum.toString().padStart(2, '0')}`;
    };

    const weekMap = new Map<string, { semana: string; criado: number; enviado: number; liberado: number; rodando: number }>();
    const order: string[] = [];
    
    // Gera as 8 semanas consecutivas retroativamente (até 60 dias para cobrir 8 semanas)
    for (let i = 7; i >= 0; i--) {
        const d = new Date(targetDate.getTime());
        d.setDate(d.getDate() - (i * 7));
        const key = getWeekKey(d);
        if (!weekMap.has(key)) {
            order.push(key);
            weekMap.set(key, { semana: key, criado: 0, enviado: 0, liberado: 0, rodando: 0 });
        }
    }

    // Busca dados no Supabase. Filtramos por uma janela ampla de 120 dias para garantir o histórico
    const startDate = new Date(targetDate.getTime());
    startDate.setDate(startDate.getDate() - 120);
    const startDateISO = startDate.toISOString().split('T')[0];
    const endDateISO = targetDate.toISOString().split('T')[0];

    let query = client.from('dados_marketing').select('*');
    
    // Filtro mais abrangente por datas de negócio ou criação
    query = query.or(`data_envio.gte.${startDateISO},data_liberacao.gte.${startDateISO},created_at.gte.${startDate.toISOString()}`);

    if (organizationId) query = query.eq('organization_id', organizationId);
    if (city) query = buildCityQuery(query, city);

    const { data, error } = await query;
    if (error) return order.map(key => weekMap.get(key)!);

    data.forEach(item => {
        // Business Logic: Prioriza a data de envio, depois liberação, por fim criação
        const dateStr = item.data_envio || item.data_liberacao || item.created_at;
        if (!dateStr) return;
        
        // Converte string YYYY-MM-DD para Date de forma segura (evitando timezone shift indesejado)
        const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
        const weekKey = getWeekKey(d);
        
        if (weekMap.has(weekKey)) {
            const w = weekMap.get(weekKey)!;
            w.criado++;
            if (item.data_envio) w.enviado++;
            if (item.data_liberacao) w.liberado++;
            if (item.rodando === 'Sim') w.rodando++;
        }
    });

    return order.map(key => weekMap.get(key)!);
}
