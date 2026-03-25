import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingTotals, MarketingCityData, MarketingDateFilter, MarketingCostsComparison, MarketingCostData } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ATENDENTE_TO_ID, REGIAO_TO_CIDADE_VALORES } from './atendenteMappers';

const IS_DEV = process.env.NODE_ENV === 'development';

const EXCLUDED_ENVIADOS = ['Confirmar', 'Cancelado', 'Abrindo MEI'];
const ABERTO_STATUSES = [
    'Aberto', 
    'aguardando liberação', 
    'Aguardando Liberação',
    'Aguardando Liberação Onboarding', 
    'retorno',
    'Retorno', 
    'a enviar',
    'A enviar 2.0'
];

const VOLTOU_STATUSES = [
    'voltou', 
    'Voltou', 
    'entregador desistiu', 
    'Entregador desistiu', 
    'bug onboarding',
    'Bug Onboarding'
];

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

    let abertoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .not('data_envio', 'is', null)
        .in('status', ABERTO_STATUSES);
    if (filters.filtroEnviados.dataInicial) abertoQuery = buildDateFilterQuery(abertoQuery, 'data_envio', filters.filtroEnviados);
    const { count: abertoCount } = await abertoQuery;
        
    let voltouQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .not('data_envio', 'is', null)
        .in('status', VOLTOU_STATUSES);
    if (filters.filtroEnviados.dataInicial) voltouQuery = buildDateFilterQuery(voltouQuery, 'data_envio', filters.filtroEnviados);
    const { count: voltouCount } = await voltouQuery;

    // Contagem de criados: preferimos o campo 'Criado' (data preenchida pelo upload),
    // mas aceitamos também registros que tenham algo em created_at ou data_envio.
    const { count: criadoCount } = await applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .or('Criado.not.is.null,created_at.not.is.null,data_envio.not.is.null');

    let enviadoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .not('status', 'eq', 'Confirmar')
        .not('status', 'eq', 'Cancelado')
        .not('status', 'eq', 'Abrindo MEI')
        .not('data_envio', 'is', null);
    if (filters.filtroEnviados.dataInicial) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
    const { count: enviadoCount } = await enviadoQuery;

    let liberadoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .eq('status', 'Liberado')
        .not('data_liberacao', 'is', null);
    if (filters.filtroLiberacao.dataInicial) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
    const { count: liberadoCount } = await liberadoQuery;

    let rodandoQuery = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
        .not('rodou_dia', 'is', null);
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
    client: SupabaseClient = supabase,
    allCities: boolean = false
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

    const cidadesToProcess = allCities || !filters.praca ? CIDADES : [filters.praca];
    
    // Como o RPC ainda não tem o campo 'criado' e não faz o filtro de mês total para ele,
    // vamos usar sempre a lógica manual para as cidades quando criados forem necessários
    // ou se o RPC falhar.
    
    if (!rpcError && rpcData && Array.isArray(rpcData) && !allCities) {
        const rpcMap = new Map(rpcData.map(item => [item.cidade, item]));
        return cidadesToProcess.map(cidade => {
            const item = rpcMap.get(cidade);
            return { 
                cidade, 
                criado: 0, // RPC ainda não retorna individualmente
                enviado: item?.enviado || 0, 
                liberado: item?.liberado || 0, 
                rodandoInicio: item?.rodando_inicio || 0,
                aberto: 0, // RPC ainda não retorna individualmente
                voltou: 0,  // RPC ainda não retorna individualmente
                conversas: 0
            };
        });
    }

    // Forçamos o fallback manual para garantir a aplicação das regras de mapeamento de cidade 
    // e o cálculo de mês cheio para TODAS as métricas (não apenas criados).
    if (IS_DEV) safeLog.info('Using manual fetch for cities data to ensure accuracy');
    
    const results: MarketingCityData[] = [];
    
    // Calcula o intervalo do mês baseado nos filtros de data
    const anyDate = filters.filtroEnviados.dataInicial || filters.filtroLiberacao.dataInicial || filters.filtroRodouDia.dataInicial || filters.filtroDataInicio.dataInicial;
    let monthFilter: MarketingDateFilter | null = null;
    
    if (anyDate) {
        const d = new Date(anyDate + 'T12:00:00');
        monthFilter = {
            dataInicial: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
            dataFinal: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        };
    }

    for (const cidade of cidadesToProcess) {
        // Todas as queries abaixo agora usam o monthFilter (mês total) se disponível
        let enviadoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {})
            .not('status', 'eq', 'Confirmar')
            .not('status', 'eq', 'Cancelado')
            .not('status', 'eq', 'Abrindo MEI')
            .not('data_envio', 'is', null);
        if (monthFilter) enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', monthFilter);

        let liberadoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {})
            .eq('status', 'Liberado')
            .not('data_envio', 'is', null);
        if (monthFilter) liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_envio', monthFilter);

        let rodandoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {})
            .not('rodou_dia', 'is', null);
        if (monthFilter) rodandoQuery = buildDateFilterQuery(rodandoQuery, 'data_envio', monthFilter);

        let criadoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {});
        if (monthFilter) {
            criadoQuery = criadoQuery.gte('Criado', monthFilter.dataInicial).lte('Criado', monthFilter.dataFinal);
        }

        let abertoQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .in('status', ABERTO_STATUSES)
            .match(organizationId ? { organization_id: organizationId } : {})
            .not('data_envio', 'is', null);
        if (monthFilter) abertoQuery = buildDateFilterQuery(abertoQuery, 'data_envio', monthFilter);

        let voltouQuery = buildCityQuery(client.from('dados_marketing').select('*', { count: 'exact', head: true }), cidade)
            .in('status', VOLTOU_STATUSES)
            .match(organizationId ? { organization_id: organizationId } : {})
            .not('data_envio', 'is', null);
        if (monthFilter) voltouQuery = buildDateFilterQuery(voltouQuery, 'data_envio', monthFilter);

        const [e, l, r, a, v, c] = await Promise.all([enviadoQuery, liberadoQuery, rodandoQuery, abertoQuery, voltouQuery, criadoQuery]);
        results.push({ 
            cidade, 
            criado: c.count || 0,
            enviado: e.count || 0, 
            liberado: l.count || 0, 
            rodandoInicio: r.count || 0,
            aberto: a.count || 0,
            voltou: v.count || 0,
            conversas: 0
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

        if (item.data_liberacao && item.status === 'Liberado') {
            processDate(item.data_liberacao, 'liberado');
        }
        
        if (item.data_envio) {
            if (!EXCLUDED_ENVIADOS.includes(item.status)) {
                processDate(item.data_envio, 'enviado');
            }
            // Caso especial para contar 'aberto' e 'voltou' na evolução diária se necessário
            // Atualmente o mapa diário só tem {liberado, enviado, rodando, criado}
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

    const weekMap = new Map<string, { 
        semana: string; criado: number; enviado: number; liberado: number; rodando: number; aberto: number; voltou: number; conversas: number 
    }>();
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
            weekMap.set(key, { semana: getWeekLabel(key), criado: 0, enviado: 0, liberado: 0, rodando: 0, aberto: 0, voltou: 0, conversas: 0 });
        }
    }

    const queryStartISO = finalStart.toISOString().split('T')[0];
    const queryEndISO = end.toISOString().split('T')[0];

    let query = client.from('dados_marketing').select('*, status, conversas');

    // Filtra qualquer métrica dentro do intervalo escolhido
    // (inclui o campo 'Criado' para gerar o gráfico corretamente quando ele existe)
    query = query.or(`data_envio.gte.${queryStartISO},data_liberacao.gte.${queryStartISO},created_at.gte.${queryStartISO},Criado.gte.${queryStartISO},rodou_dia.gte.${queryStartISO}`);
    query = query.or(`data_envio.lte.${queryEndISO},data_liberacao.lte.${queryEndISO},created_at.lte.${queryEndISO},Criado.lte.${queryEndISO},rodou_dia.lte.${queryEndISO}`);

    if (organizationId) query = query.eq('organization_id', organizationId);
    if (city) query = buildCityQuery(query, city);

    const { data, error } = await query;
    if (error) return order.map(key => weekMap.get(key)!);

    data.forEach(item => {
        const processMetric = (dateStr: string | null, type: 'criado' | 'enviado' | 'liberado' | 'rodando' | 'aberto' | 'voltou' | 'conversas', val: number = 1) => {
            if (!dateStr) return;
            const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
            const weekKey = getWeekKey(d);

            if (weekMap.has(weekKey)) {
                const w = weekMap.get(weekKey)!;
                if (type === 'criado') w.criado += val;
                if (type === 'enviado') w.enviado += val;
                if (type === 'liberado') w.liberado += val;
                if (type === 'rodando') w.rodando += val;
                if (type === 'aberto') w.aberto += val;
                if (type === 'voltou') w.voltou += val;
                if (type === 'conversas') w.conversas += val;
            }
        };

        // Cada métrica conta na semana em que foi registrada
        processMetric(item.Criado || item.created_at || item.data_envio, 'criado');
        
        if (item.data_envio) {
            if (!EXCLUDED_ENVIADOS.includes(item.status)) {
                processMetric(item.data_envio, 'enviado');
            }
            if (ABERTO_STATUSES.includes(item.status)) {
                processMetric(item.data_envio, 'aberto');
            }
            if (VOLTOU_STATUSES.includes(item.status)) {
                processMetric(item.data_envio, 'voltou');
            }
        }
        
        if (item.data_liberacao && item.status === 'Liberado') {
            processMetric(item.data_liberacao, 'liberado');
        }
        
        processMetric(item.rodou_dia, 'rodando');

        if (item.conversas) {
            processMetric(item.data_envio || item.created_at || item.data_liberacao, 'conversas', Number(item.conversas) || 0);
        }
    });

    // Passo 2: Buscar conversas da tabela de custos (novidade)
    let costQuery = client.from('dados_valores_cidade').select('data, conversas, cidade');
    if (organizationId) costQuery = costQuery.eq('organization_id', organizationId);
    
    // Filtrar por cidade se especificado
    if (city) {
        if (city === 'ABC 2.0') {
            costQuery = costQuery.in('cidade', ['ABC', 'ABC 2.0', 'SANTO ANDRÉ', 'SÃO BERNARDO', 'SANTO ANDRE', 'SAO BERNARDO']);
        } else {
            const normalizedCity = city.replace(' 2.0', '').toUpperCase();
            costQuery = costQuery.or(`cidade.ilike.%${normalizedCity}%`);
        }
    }

    const { data: costData } = await costQuery.gte('data', queryStartISO).lte('data', queryEndISO);

    costData?.forEach(item => {
        if (item.conversas) {
            const d = new Date(`${item.data}T12:00:00`);
            const weekKey = getWeekKey(d);
            if (weekMap.has(weekKey)) {
                weekMap.get(weekKey)!.conversas += Number(item.conversas) || 0;
            }
        }
    });

    return order.map(key => weekMap.get(key)!);
}

/**
 * Busca dados para comparação de custos entre semana atual e anterior
 */
export async function fetchMarketingCostsComparison(
    filters: MarketingFilters,
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<MarketingCostsComparison> {
    const currentStart = filters.filtroEnviados.dataInicial;
    const currentEnd = filters.filtroEnviados.dataFinal;

    if (!currentStart || !currentEnd) {
        return { atual: [], passada: [] };
    }

    const start = new Date(currentStart + 'T12:00:00');

    // Mês atual (cheio para o RPC, que filtrará pelos dados existentes)
    const currentMonthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const currentMonthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    // Mês anterior (cheio)
    // Lógica de "Corte na Quarta-feira":
    // O usuário quer que o mês anterior (Passada) mostre até a quarta-feira correspondente à semana do filtro.
    // Ex: Filtro 09-15/03 (Março). Quarta-feira daquela semana é dia 11. 
    // Mês Passado (Fevereiro) deve mostrar do dia 01 até o dia 11.
    const endRef = new Date(currentEnd + 'T12:00:00');
    const getTargetWednesday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay(); // 0=Dom, 3=Qua, 6=Sab
        let diff = 0;
        if (day === 3) diff = 0; // Se já é quarta, mantém o dia 11
        else if (day > 3) diff = day - 3;
        else diff = day + 4;
        
        const wed = new Date(date);
        wed.setDate(date.getDate() - diff);
        return wed;
    };

    const targetWedActual = getTargetWednesday(endRef);
    const targetDay = targetWedActual.getDate();

    const prevMonthStart = new Date(start.getFullYear(), start.getMonth(), 1); // Same month as current
    const prevMonthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    const currentStartISO = currentStart;
    const currentEndISO = currentEnd;
    
    // Slide PASSADA (Mês Atual - Parcial): Usa o corte de quarta-feira do PRÓPRIO mês atual
    const prevStartISO = prevMonthStart.toISOString().split('T')[0];
    const prevMonthEndWithCut = new Date(prevMonthStart);
    prevMonthEndWithCut.setDate(targetDay);
    const prevEndISO = prevMonthEndWithCut.toISOString().split('T')[0];
        const fetchRange = async (sISO: string, eISO: string) => {
        // Agregação por cidade
        const cityMap = new Map<string, { valorUsado: number; rodando: number; liberado: number; aberto: number; conversas: number }>();

        // Mapeamento inverso para buscar no RPC/Custos
        const DISPLAY_CITY_TO_DB_CITY: Record<string, string> = {
            'São Paulo 2.0': 'SAO PAULO',
            'Salvador 2.0': 'SALVADOR',
            'Guarulhos 2.0': 'GUARULHOS',
            'Manaus 2.0': 'MANAUS',
            'Sorocaba 2.0': 'SOROCABA',
            'ABC 2.0': 'ABC'
        };

        // IDs dos atendentes de marketing para filtrar os custos corretamente
        const allMarketingIds: string[] = [];
        Object.values(ATENDENTE_TO_ID).forEach(id => {
            if (Array.isArray(id)) allMarketingIds.push(...id);
            else allMarketingIds.push(id);
        });
            // Passo 1: Buscar TODOS os Custos de Marketing da organização no período
        let globalCustoQuery = client.from('dados_valores_cidade')
            .select('valor, cidade, id_atendente, organization_id, conversas')
            .gte('data', sISO)
            .lte('data', eISO)
            .in('id_atendente', allMarketingIds);

        if (organizationId) {
            globalCustoQuery = globalCustoQuery.eq('organization_id', organizationId);
        }
        
        const { data: allCostRecords } = await globalCustoQuery;

        // Passo 2: Buscar Métricas por cidade em paralelo
        const slideCities = [
            'São Paulo 2.0',
            'Guarulhos 2.0',
            'Manaus 2.0',
            'ABC 2.0',
            'Sorocaba 2.0',
            'Salvador 2.0'
        ];

        await Promise.all(slideCities.map(async (displayName) => {
            let cityValor = 0;
            let cityConversas = 0;
            const normalizedDisplay = displayName.toUpperCase().trim();
            const dbMapped = REGIAO_TO_CIDADE_VALORES[displayName];

            allCostRecords?.forEach(row => {
                const rowCidade = (row.cidade || '').toUpperCase().trim();
                let match = false;

                if (displayName === 'ABC 2.0') {
                    if (rowCidade === 'ABC' || rowCidade === 'ABC 2.0' || rowCidade === 'SANTO ANDRÉ' || rowCidade === 'SÃO BERNARDO' || rowCidade === 'SANTO ANDRE' || rowCidade === 'SAO BERNARDO') match = true;
                } else if (normalizedDisplay.includes('TABOÃO') || normalizedDisplay.includes('TABOAO')) {
                    if (rowCidade.includes('TABOÃO') || rowCidade.includes('TABOAO')) match = true;
                } else {
                    if (rowCidade === normalizedDisplay || rowCidade === dbMapped) match = true;
                    const simpleRow = rowCidade.replace(' 2.0', '').trim();
                    const simpleDisplay = normalizedDisplay.replace(' 2.0', '').trim();
                    if (simpleRow === simpleDisplay) match = true;
                }

                if (match) {
                    cityValor += Number(row.valor) || 0;
                    cityConversas += Number((row as any).conversas) || 0;
                }
            });
            
            const fetchCityMetric = async (city: string) => {
                const getBaseQuery = () => {
                    let q = client.from('dados_marketing').select('*', { count: 'exact', head: true });
                    if (organizationId) q = q.eq('organization_id', organizationId);
                    return buildCityQuery(q, city);
                };

                const [l, r, a] = await Promise.all([
                    getBaseQuery().eq('status', 'Liberado').gte('data_envio', sISO).lte('data_envio', eISO),
                    getBaseQuery().not('rodou_dia', 'is', null).gte('rodou_dia', sISO).lte('rodou_dia', eISO),
                    getBaseQuery().in('status', ABERTO_STATUSES).gte('data_envio', sISO).lte('data_envio', eISO),
                ]);
                
                return { l: l.count || 0, r: r.count || 0, a: a.count || 0, conv: 0 }; // conv será somado via cityConversas
            };

            let metrics = { l: 0, r: 0, a: 0, conv: 0 };
            if (displayName === 'ABC 2.0') {
                const [m1, m2] = await Promise.all([fetchCityMetric('Santo André'), fetchCityMetric('São Bernardo')]);
                metrics = { l: m1.l + m2.l, r: m1.r + m2.r, a: m1.a + m2.a, conv: m1.conv + m2.conv };
            } else {
                metrics = await fetchCityMetric(displayName);
            }
            cityMap.set(displayName, {
                valorUsado: cityValor,
                liberado: metrics.l,
                rodando: metrics.r,
                aberto: metrics.a,
                conversas: cityConversas
            });
        }));

        const result: MarketingCostData[] = [];
        let otherValor = 0;
        let otherLiberado = 0;
        let otherRodando = 0;
        let otherAberto = 0;

        cityMap.forEach((v, k) => {
            let simplifiedName = k;
            if (k === 'São Paulo 2.0') simplifiedName = 'São Paulo';
            if (k === 'Salvador 2.0') simplifiedName = 'Salvador';
            if (k === 'Guarulhos 2.0') simplifiedName = 'Guarulhos';
            if (k === 'Manaus 2.0') simplifiedName = 'Manaus';
            if (k === 'ABC 2.0') simplifiedName = 'ABC';
            if (k === 'Sorocaba 2.0') simplifiedName = 'Sorocaba';
            if (k === 'Taboão da Serra e Embu das Artes 2.0') simplifiedName = 'Taboão/Embu';

            result.push({
                regiao: simplifiedName,
                valorUsado: v.valorUsado,
                rodando: v.rodando,
                liberado: v.liberado,
                aberto: v.aberto,
                conversas: v.conversas,
                cpa: v.rodando > 0 ? v.valorUsado / v.rodando : 0
            });
        });

        allCostRecords?.forEach(row => {
            const rowCidade = (row.cidade || '').toUpperCase().trim();
            let matchedAny = false;
            
            slideCities.forEach(displayName => {
                const normalizedDisplay = displayName.toUpperCase().trim();
                const dbMapped = REGIAO_TO_CIDADE_VALORES[displayName];
                
                if (displayName === 'ABC 2.0') {
                    if (rowCidade === 'ABC' || rowCidade === 'ABC 2.0' || rowCidade === 'SANTO ANDRÉ' || rowCidade === 'SÃO BERNARDO' || rowCidade === 'SANTO ANDRE' || rowCidade === 'SAO BERNARDO') matchedAny = true;
                } else if (normalizedDisplay.includes('TABOÃO') || normalizedDisplay.includes('TABOAO')) {
                    if (rowCidade.includes('TABOÃO') || rowCidade.includes('TABOAO')) matchedAny = true;
                } else {
                    if (rowCidade === normalizedDisplay || rowCidade === dbMapped) matchedAny = true;
                    const simpleRow = rowCidade.replace(' 2.0', '').trim();
                    const simpleDisplay = normalizedDisplay.replace(' 2.0', '').trim();
                    if (simpleRow === simpleDisplay) matchedAny = true;
                }
            });

            if (!matchedAny) otherValor += Number(row.valor) || 0;
        });

        if (otherValor > 0 || otherLiberado > 0 || otherRodando > 0) {
            result.push({
                regiao: 'Outros',
                valorUsado: otherValor,
                rodando: otherRodando,
                liberado: otherLiberado,
                aberto: otherAberto,
                conversas: 0,
                cpa: otherRodando > 0 ? otherValor / otherRodando : 0
            });
        }
        
        const priority = ['São Paulo', 'Guarulhos', 'Manaus', 'ABC', 'Sorocaba', 'Salvador', 'Taboão/Embu', 'Outros'];
        return result.sort((a, b) => {
            const idxA = priority.indexOf(a.regiao);
            const idxB = priority.indexOf(b.regiao);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.regiao.localeCompare(b.regiao);
        });
    };

    const [atualData, passadaData] = await Promise.all([
        fetchRange(currentStartISO, currentEndISO), // Range de mês cheio (ex: 1 a 31)
        fetchRange(prevStartISO, prevEndISO)   // Range de corte de quarta (ex: 1 a 11)
    ]);

    return { atual: atualData, passada: passadaData };
}

