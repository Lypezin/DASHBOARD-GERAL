import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { buildCityQuery } from '@/utils/marketingQueries';
import { getMondayOfIsoWeek, getWeekKey, getWeekLabel } from '../dateUtils';
import { EXCLUDED_ENVIADOS } from '../constants';

export async function fetchMarketingWeeklyComparisonByCity(
    organizationId: string | null,
    cities: string[],
    startDate: string | null = null,
    endDate: string | null = null,
    client: SupabaseClient = supabase
): Promise<Array<{ cidade: string; data: any[] }>> {
    const end = endDate ? new Date(endDate) : new Date();
    // 56 dias para garantir cobertura de 8 semanas completas
    const rawStart = startDate ? new Date(startDate) : (d => { d.setDate(d.getDate() - 56); return d; })(new Date(end));
    const startOfFirstWeek = getMondayOfIsoWeek(rawStart);
    const endOfLastWeek = getMondayOfIsoWeek(end);
    
    const minStart = (d => { d.setDate(d.getDate() - 56); return d; })(new Date(endOfLastWeek));
    const finalStart = startOfFirstWeek > minStart ? minStart : startOfFirstWeek;
    const startStr = finalStart.toISOString().split('T')[0];

    // Busca robusta: pega tudo que teve atividade no período em qualquer campo de data relevante
    const dateFilters = [
        `data_envio.gte.${startStr}`,
        `data_liberacao.gte.${startStr}`,
        `created_at.gte.${startStr}`,
        `Criado.gte.${startStr}`,
        `rodou_dia.gte.${startStr}`
    ].join(',');

    let q = client.from('dados_marketing').select('*');
    if (organizationId) q = q.eq('organization_id', organizationId);
    q = q.or(dateFilters);

    const { data: marketingData } = await q;

    return cities.map(cidade => {
        const cityMap = initializeCityWeekMap(finalStart, endOfLastWeek);
        const filteredData = marketingData?.filter(i => isItemFromCity(i, cidade)) || [];
        processCityRecords(filteredData, cityMap);
        return { cidade, data: Array.from(cityMap.values()).map(v => ({ ...v, semana: getWeekLabel(v.key) })) };
    });
}

function initializeCityWeekMap(start: Date, end: Date) {
    const map = new Map<string, any>();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        const key = getWeekKey(d);
        if (!map.has(key)) map.set(key, { key, criado: 0, enviado: 0, liberado: 0, rodando: 0 });
    }
    return map;
}

function isItemFromCity(item: any, city: string) {
    const ic = (item.regiao_atuacao || item.cidade || '').toUpperCase();
    const target = city.toUpperCase();
    if (city === 'ABC 2.0') return ['SANTO ANDRÉ', 'SÃO BERNARDO', 'ABC', 'ABC 2.0'].some(c => ic.includes(c));
    return ic.includes(target.replace(' 2.0', ''));
}

function processCityRecords(data: any[], map: Map<string, any>) {
    data.forEach(i => {
        const add = (d: string | null, type: string) => {
            if (!d) return; const k = getWeekKey(new Date(d.length === 10 ? `${d}T12:00:00` : d));
            if (map.has(k)) map.get(k)[type]++;
        };
        add(i.Criado || i.created_at || i.data_envio, 'criado');
        if (i.data_envio && !EXCLUDED_ENVIADOS.includes(i.status)) add(i.data_envio, 'enviado');
        if (i.data_liberacao && i.status === 'Liberado') add(i.data_liberacao, 'liberado');
        add(i.rodou_dia, 'rodando');
    });
}
