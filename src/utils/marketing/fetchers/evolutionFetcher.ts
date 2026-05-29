import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters } from '@/types';
import { EXCLUDED_ENVIADOS } from '../constants';

export async function fetchMarketingDailyEvolution(
    filters: MarketingFilters,
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<Array<{ data: string; liberado: number; enviado: number; rodando: number; criado: number }>> {
    let query = client.from('dados_marketing').select('data_liberacao, data_envio, rodou_dia, Criado, created_at, status')
        .match(organizationId ? { organization_id: organizationId } : {});

    if (filters.praca) query = buildCityQuery(query, filters.praca);

    const { minDate, maxDate } = getEvolutionRange(filters);
    if (minDate && maxDate) {
        const conds = ['data_envio', 'data_liberacao', 'rodou_dia', 'Criado'].map(f => `and(${f}.gte.${minDate},${f}.lte.${maxDate})`);
        query = query.or(conds.join(','));
    }

    const { data, error } = await query;
    if (error) {
        safeLog.error('Erro ao buscar evolução diária:', error);
        return [];
    }

    const dailyMap = processDailyData(data, minDate, maxDate);
    if (minDate && maxDate) fillDailyGaps(dailyMap, data, minDate, maxDate);

    return Array.from(dailyMap.values()).sort((a, b) => a.data.localeCompare(b.data));
}

function getEvolutionRange(filters: MarketingFilters) {
    const minDate = filters.filtroEnviados.dataInicial || filters.filtroLiberacao.dataInicial || filters.filtroRodouDia.dataInicial || filters.filtroDataInicio.dataInicial;
    const maxDate = filters.filtroEnviados.dataFinal || filters.filtroLiberacao.dataFinal || filters.filtroRodouDia.dataFinal || filters.filtroDataInicio.dataFinal;
    if (!minDate) return { minDate: null, maxDate: null };
    const dStart = new Date(minDate + 'T12:00:00'); dStart.setDate(1);
    const dEnd = new Date((maxDate || new Date().toISOString()) + 'T12:00:00'); dEnd.setMonth(dEnd.getMonth() + 1); dEnd.setDate(0);
    return { minDate: dStart.toISOString().split('T')[0], maxDate: dEnd.toISOString().split('T')[0] };
}

function processDailyData(data: any[], min: string | null, max: string | null) {
    const dailyMap = new Map<string, { data: string; liberado: number; enviado: number; rodando: number; criado: number }>();
    data.forEach(item => {
        const add = (d: string | null, type: 'liberado' | 'enviado' | 'rodando' | 'criado') => {
            if (!d) return;
            const ds = d.split('T')[0];
            if (min && max && (ds < min || ds > max)) return;
            const res = dailyMap.get(ds) || { data: ds, liberado: 0, enviado: 0, rodando: 0, criado: 0 };
            res[type]++;
            dailyMap.set(ds, res);
        };
        if (item.data_liberacao && item.status === 'Liberado') add(item.data_liberacao, 'liberado');
        if (item.data_envio && !EXCLUDED_ENVIADOS.includes(item.status)) add(item.data_envio, 'enviado');
        add(item.rodou_dia, 'rodando');
        add(item.Criado || item.created_at || item.data_envio, 'criado');
    });
    return dailyMap;
}

function fillDailyGaps(map: Map<string, any>, data: any[], min: string, max: string) {
    const lastDay = data.reduce((m, i) => {
        const itemDates = [i.data_liberacao, i.data_envio, i.rodou_dia, i.Criado].filter(Boolean).map(d => d!.split('T')[0]).filter(d => d <= max);
        if (!itemDates.length) return m;
        const maxI = itemDates.sort().reverse()[0]; return maxI > m ? maxI : m;
    }, min);
    for (let c = new Date(min + 'T12:00:00'); c <= new Date(lastDay + 'T12:00:00'); c.setDate(c.getDate() + 1)) {
        const s = c.toISOString().split('T')[0];
        if (!map.has(s)) map.set(s, { data: s, liberado: 0, enviado: 0, rodando: 0, criado: 0 });
    }
}
