import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { buildCityQuery } from '@/utils/marketingQueries';
import { getMondayOfIsoWeek, getWeekKey, getWeekLabel } from '../dateUtils';
import { EXCLUDED_ENVIADOS, ABERTO_STATUSES, VOLTOU_STATUSES } from '../constants';

export async function fetchMarketingWeeklyComparison(
    organizationId: string | null,
    city: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null,
    client: SupabaseClient = supabase
): Promise<Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>> {
    const end = endDate ? new Date(endDate) : new Date();
    const rawStart = startDate ? new Date(startDate) : (d => { d.setDate(d.getDate() - 56); return d; })(new Date(end));
    const startOfFirstWeek = getMondayOfIsoWeek(rawStart);
    const endOfLastWeek = getMondayOfIsoWeek(end);
    const minStart = (d => { d.setDate(d.getDate() - 56); return d; })(new Date(endOfLastWeek));
    const finalStart = startOfFirstWeek > minStart ? minStart : startOfFirstWeek;

    const { weekMap, order } = initializeWeekMap(finalStart, endOfLastWeek);
    const sISO = finalStart.toISOString().split('T')[0];
    const eISO = end.toISOString().split('T')[0];

    const [marketingData, costData] = await Promise.all([
        fetchMarketingRecords(client, organizationId, city, sISO, eISO),
        fetchCostRecords(client, organizationId, city, sISO, eISO)
    ]);

    processMarketingRecords(marketingData, weekMap);
    processCostRecords(costData, weekMap);

    return order.map(key => ({ ...weekMap.get(key)!, semana: getWeekLabel(key) }));
}

function initializeWeekMap(start: Date, end: Date) {
    const weekMap = new Map<string, any>();
    const order: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        const key = getWeekKey(d); if (!weekMap.has(key)) { order.push(key); weekMap.set(key, { criado: 0, enviado: 0, liberado: 0, rodando: 0, aberto: 0, voltou: 0, conversas: 0 }); }
    }
    return { weekMap, order };
}

async function fetchMarketingRecords(client: SupabaseClient, orgId: string | null, city: string | null, s: string, e: string) {
    let q = client.from('dados_marketing').select('*, status, conversas');
    
    // Filtro unificado de data: pega registros que tiveram atividade no período em QUALQUER um dos campos relevantes
    const dateFilters = [
        `data_envio.gte.${s}`,
        `data_liberacao.gte.${s}`,
        `created_at.gte.${s}`,
        `Criado.gte.${s}`,
        `rodou_dia.gte.${s}`
    ].join(',');
    
    q = q.or(dateFilters);
    
    if (orgId) q = q.eq('organization_id', orgId);
    if (city) q = buildCityQuery(q, city);
    
    // Filtro de fim de período para evitar excesso de dados (opcional, mas recomendado para performance)
    // Usamos um OR similar para garantir que pelo menos uma data de atividade esteja dentro do limite superior
    const endDateFilters = [
        `data_envio.lte.${e}`,
        `data_liberacao.lte.${e}`,
        `created_at.lte.${e}`,
        `Criado.lte.${e}`,
        `rodou_dia.lte.${e}`
    ].join(',');
    
    q = q.or(endDateFilters);
    
    return (await q).data || [];
}

async function fetchCostRecords(client: SupabaseClient, orgId: string | null, city: string | null, s: string, e: string) {
    let q = client.from('dados_valores_cidade').select('data, conversas, cidade');
    if (orgId) q = q.eq('organization_id', orgId);
    if (city) {
        if (city === 'ABC 2.0') q = q.in('cidade', ['ABC', 'ABC 2.0', 'SANTO ANDRÉ', 'SÃO BERNARDO', 'SANTO ANDRE', 'SAO BERNARDO']);
        else q = q.or(`cidade.ilike.%${city.replace(' 2.0', '').toUpperCase()}%`);
    }
    return (await q.gte('data', s).lte('data', e)).data || [];
}

function processMarketingRecords(data: any[], map: Map<string, any>) {
    data.forEach(i => {
        const add = (d: string | null, t: string, val: number = 1) => {
            if (!d) return; const k = getWeekKey(new Date(d.length === 10 ? `${d}T12:00:00` : d));
            if (map.has(k)) { const w = map.get(k)!; (w as any)[t] += val; }
        };
        add(i.Criado || i.created_at || i.data_envio, 'criado');
        if (i.data_envio) {
            if (!EXCLUDED_ENVIADOS.includes(i.status)) add(i.data_envio, 'enviado');
            if (ABERTO_STATUSES.includes(i.status)) add(i.data_envio, 'aberto');
            if (VOLTOU_STATUSES.includes(i.status)) add(i.data_envio, 'voltou');
        }
        if (i.data_liberacao && i.status === 'Liberado') add(i.data_liberacao, 'liberado');
        add(i.rodou_dia, 'rodando');
        if (i.conversas) add(i.data_envio || i.created_at || i.data_liberacao, 'conversas', Number(i.conversas) || 0);
    });
}

function processCostRecords(data: any[], map: Map<string, any>) {
    data.forEach(i => {
        if (i.conversas) {
            const k = getWeekKey(new Date(`${i.data}T12:00:00`));
            if (map.has(k)) map.get(k)!.conversas += Number(i.conversas) || 0;
        }
    });
}
