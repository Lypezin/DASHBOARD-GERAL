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
    const applyBaseFilters = (q: any) => {
        let filtered = q.match(organizationId ? { organization_id: organizationId } : {});
        if (filters.praca) {
            filtered = buildCityQuery(filtered, filters.praca);
        }
        return filtered;
    };

    const { count: abertoCount } = await applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .eq('status', 'Aberto');
        
    const { count: voltouCount } = await applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .eq('status', 'Voltou');

    // Contagem de criados: preferimos o campo 'Criado' (data preenchida pelo upload),
    // mas aceitamos também registros que tenham algo em created_at ou data_envio.
    const { count: criadoCount } = await applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .or('Criado.not.is.null,created_at.not.is.null,data_envio.not.is.null');

    let enviadoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .not('status', 'in', '("Confirmar", "Cancelado", "Abrindo MEI")');
    if (filters.filtroEnviados.dataInicial) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
    const { count: enviadoCount } = await enviadoQuery;

    let liberadoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }));
    if (filters.filtroLiberacao.dataInicial) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
    const { count: liberadoCount } = await liberadoQuery;

    let rodandoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }));
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

    const cidadesToProcess = filters.praca ? [filters.praca] : CIDADES;

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
        const rpcMap = new Map(rpcData.map(item => [item.cidade, item]));
        return cidadesToProcess.map(cidade => {
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
    for (const cidade of cidadesToProcess) {
        let enviadoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {})
            .not('status', 'in', '("Confirmar", "Cancelado", "Abrindo MEI")');
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
): Promise<Array<{ data: string; liberado: number; enviado: number; rodando: number; criado: number }>> {
    // Busca evolução diária baseada nos filtros ativos
    let query = client
        .from('dados_marketing')
        .select('data_liberacao, data_envio, rodou_dia, Criado, created_at, status')
        .match(organizationId ? { organization_id: organizationId } : {});

    if (filters.praca) {
        query = buildCityQuery(query, filters.praca);
    }

    // Aplicar filtros de data se existirem.
    // Como os filtros estão unificados na apresentação, podemos ser abrangentes.
    const hasFilters =
        filters.filtroEnviados.dataInicial ||
        filters.filtroLiberacao.dataInicial ||
        filters.filtroRodouDia.dataInicial ||
        filters.filtroDataInicio.dataInicial;

    let minDateForFill: string | null = null;
    let maxDateForFill: string | null = null;

    if (hasFilters) {
        // Expand dates to full months for logic, but keep original for filter if needed
        let minDate =
            filters.filtroEnviados.dataInicial ||
            filters.filtroLiberacao.dataInicial ||
            filters.filtroRodouDia.dataInicial ||
            filters.filtroDataInicio.dataInicial;
        let maxDate =
            filters.filtroEnviados.dataFinal ||
            filters.filtroLiberacao.dataFinal ||
            filters.filtroRodouDia.dataFinal ||
            filters.filtroDataInicio.dataFinal;

        const dStart = new Date((minDate || new Date().toISOString()) + 'T12:00:00');
        dStart.setDate(1); // First day of the month
        const minDateMonthStart = dStart.toISOString().split('T')[0];

        const dEnd = new Date((maxDate || new Date().toISOString()) + 'T12:00:00');
        dEnd.setMonth(dEnd.getMonth() + 1);
        dEnd.setDate(0); // Last day of the month
        const maxDateMonthEnd = dEnd.toISOString().split('T')[0];

        // Ensure we only get data within the expanded month range
        const conds: string[] = [];
        const fields = ['data_envio', 'data_liberacao', 'rodou_dia', 'Criado'];
        
        fields.forEach(field => {
            const parts = [];
            if (minDateMonthStart) parts.push(`${field}.gte.${minDateMonthStart}`);
            if (maxDateMonthEnd) parts.push(`${field}.lte.${maxDateMonthEnd}`);
            if (parts.length > 0) {
                conds.push(parts.length > 1 ? `and(${parts.join(',')})` : parts[0]);
            }
        });

        if (conds.length > 0) {
            query = query.or(conds.join(','));
        }

        minDateForFill = minDateMonthStart;
        maxDateForFill = maxDateMonthEnd;
    }

    const { data, error } = await query;

    if (error) {
        safeLog.error('Erro ao buscar evolução diária:', error);
        return [];
    }

    const dailyMap = new Map<string, { data: string; liberado: number; enviado: number; rodando: number; criado: number }>();

    data.forEach(item => {
        const processDate = (d: string | null, type: 'liberado' | 'enviado' | 'rodando' | 'criado') => {
            if (!d) return;
            const dateStr = d.split('T')[0];
            
            // Se houver filtro, ignorar datas fora do intervalo expandido (mês inteiro do filtro)
            if (minDateForFill && maxDateForFill) {
                if (dateStr < minDateForFill || dateStr > maxDateForFill) return;
            }
            
            const existing = dailyMap.get(dateStr) || { data: dateStr, liberado: 0, enviado: 0, rodando: 0, criado: 0 };
            existing[type]++;
            dailyMap.set(dateStr, existing);
        };

        processDate(item.data_liberacao, 'liberado');
        if (!['Confirmar', 'Cancelado', 'Abrindo MEI'].includes(item.status)) {
            processDate(item.data_envio, 'enviado');
        }
        processDate(item.rodou_dia, 'rodando');
        processDate(item.Criado || item.created_at || item.data_envio, 'criado');
    });

    if (minDateForFill && maxDateForFill) {
        // Encontra o último dia que realmente tem dados para evitar espaço vazio no final
        const lastDayWithData = data.reduce((max, item) => {
            const itemDates = [item.data_liberacao, item.data_envio, item.rodou_dia, item.Criado]
                .filter(Boolean)
                .map(d => d!.split('T')[0])
                .filter(d => d <= maxDateForFill!); // Só considera datas dentro do limite do filtro
            
            if (itemDates.length === 0) return max;
            
            const maxItemDate = itemDates.sort().reverse()[0];
            return maxItemDate > max ? maxItemDate : max;
        }, minDateForFill);

        let cursor = new Date(minDateForFill + 'T12:00:00');
        const endCursor = new Date(lastDayWithData + 'T12:00:00');

        while (cursor <= endCursor) {
            const dayStr = cursor.toISOString().split('T')[0];
            if (!dailyMap.has(dayStr)) {
                dailyMap.set(dayStr, { data: dayStr, liberado: 0, enviado: 0, rodando: 0, criado: 0 });
            }
            cursor.setDate(cursor.getDate() + 1);
        }
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.data.localeCompare(b.data));
}

export async function fetchMarketingWeeklyComparison(
    organizationId: string | null,
    city: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null,
    client: SupabaseClient = supabase
): Promise<Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>> {
    const today = new Date();
    const end = endDate ? new Date(endDate) : today;

    // Se não houver start date definida, usamos 8 semanas antes do end.
    const rawStart = startDate ? new Date(startDate) : (() => {
        const d = new Date(end.getTime());
        d.setDate(d.getDate() - 7 * 7);
        return d;
    })();

    // Utiliza ISO week para garantir que a "Semana 01" exista quando o intervalo cobrir o início do ano.
    const getIsoWeekInfo = (date: Date) => {
        const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        // Thursday determines the week number in ISO.
        tmp.setUTCDate(tmp.getUTCDate() + 4 - ((tmp.getUTCDay() + 6) % 7));
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return { year: tmp.getUTCFullYear(), week: weekNo };
    };

    const getWeekKey = (date: Date) => {
        const { year, week } = getIsoWeekInfo(date);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    };

    const getWeekLabel = (weekKey: string) => {
        const match = weekKey.match(/^-?\d{4}-W(\d{2})$/);
        return match ? `Semana ${match[1]}` : weekKey;
    };

    const weekMap = new Map<string, { semana: string; criado: number; enviado: number; liberado: number; rodando: number }>();
    const order: string[] = [];

    const getMondayOfIsoWeek = (date: Date) => {
        const dt = new Date(date);
        const day = (dt.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
        dt.setDate(dt.getDate() - day);
        dt.setHours(12, 0, 0, 0);
        return dt;
    };

    const startOfFirstWeek = getMondayOfIsoWeek(rawStart);
    const endOfLastWeek = getMondayOfIsoWeek(end);

    // Garante pelo menos 8 semanas ao final (para manter layout consistente)
    const minStart = new Date(endOfLastWeek.getTime());
    minStart.setDate(minStart.getDate() - 7 * 7);
    const finalStart = startOfFirstWeek > minStart ? minStart : startOfFirstWeek;

    for (let d = new Date(finalStart); d <= endOfLastWeek; d.setDate(d.getDate() + 7)) {
        const key = getWeekKey(d);
        if (!weekMap.has(key)) {
            order.push(key);
            weekMap.set(key, { semana: getWeekLabel(key), criado: 0, enviado: 0, liberado: 0, rodando: 0 });
        }
    }

    const queryStartISO = finalStart.toISOString().split('T')[0];
    const queryEndISO = end.toISOString().split('T')[0];

    let query = client.from('dados_marketing').select('*, status');

    // Filtra qualquer métrica dentro do intervalo escolhido
    // (inclui o campo 'Criado' para gerar o gráfico corretamente quando ele existe)
    query = query.or(`data_envio.gte.${queryStartISO},data_liberacao.gte.${queryStartISO},created_at.gte.${queryStartISO},Criado.gte.${queryStartISO},rodou_dia.gte.${queryStartISO}`);
    query = query.or(`data_envio.lte.${queryEndISO},data_liberacao.lte.${queryEndISO},created_at.lte.${queryEndISO},Criado.lte.${queryEndISO},rodou_dia.lte.${queryEndISO}`);

    if (organizationId) query = query.eq('organization_id', organizationId);
    if (city) query = buildCityQuery(query, city);

    const { data, error } = await query;
    if (error) return order.map(key => weekMap.get(key)!);

    data.forEach(item => {
        const processMetric = (dateStr: string | null, type: 'criado' | 'enviado' | 'liberado' | 'rodando') => {
            if (!dateStr) return;
            const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
            const weekKey = getWeekKey(d);

            if (weekMap.has(weekKey)) {
                const w = weekMap.get(weekKey)!;
                if (type === 'criado') w.criado++;
                if (type === 'enviado') w.enviado++;
                if (type === 'liberado') w.liberado++;
                if (type === 'rodando') w.rodando++;
            }
        };

        // Cada métrica conta na semana em que foi registrada
        // Para 'criado', usamos o novo campo 'Criado' (data de criação),
        // caindo em created_at e depois em data_envio como fallback.
        processMetric(item.Criado || item.created_at || item.data_envio, 'criado');
        if (!['Confirmar', 'Cancelado', 'Abrindo MEI'].includes(item.status)) {
            processMetric(item.data_envio, 'enviado');
        }
        processMetric(item.data_liberacao, 'liberado');
        if (item.rodando === 'Sim') processMetric(item.rodou_dia, 'rodando');
    });

    return order.map(key => weekMap.get(key)!);
}

