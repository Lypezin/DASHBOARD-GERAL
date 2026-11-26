import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters } from '@/types';
import { EXCLUDED_ENVIADOS } from '../constants';
import { fetchAllMarketingRows } from './queryErrors';

export async function fetchMarketingDailyEvolution(
    filters: MarketingFilters,
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<Array<{ data: string; liberado: number; enviado: number; rodando: number; criado: number }>> {
    const { minDate, maxDate } = getEvolutionRange(filters);
    const rows = await fetchAllMarketingRows('Erro ao buscar evolução diária.', (from, to, includeExactCount) => {
        let query = client.from('dados_marketing')
            .select('id, data_liberacao, data_envio, rodou_dia, Criado, created_at, status', includeExactCount ? { count: 'exact' } : undefined)
            .match(organizationId ? { organization_id: organizationId } : {});

        if (filters.praca) query = buildCityQuery(query, filters.praca);

        if (minDate && maxDate) {
            const conds = ['data_envio', 'data_liberacao', 'rodou_dia', 'Criado'].map(f => `and(${f}.gte.${minDate},${f}.lte.${maxDate})`);
            query = query.or(conds.join(','));
        }

        return query.order('id', { ascending: true }).range(from, to);
    });

    const dailyMap = processDailyData(rows, minDate, maxDate);
    if (minDate && maxDate) fillDailyGaps(dailyMap, rows, minDate, maxDate);

    return Array.from(dailyMap.values()).sort((a, b) => a.data.localeCompare(b.data));
}

function getEvolutionRange(filters: MarketingFilters) {
    const minDate = filters.filtroEnviados.dataInicial || filters.filtroLiberacao.dataInicial || filters.filtroRodouDia.dataInicial || filters.filtroDataInicio.dataInicial;
    const maxDate = filters.filtroEnviados.dataFinal || filters.filtroLiberacao.dataFinal || filters.filtroRodouDia.dataFinal || filters.filtroDataInicio.dataFinal;
    if (!minDate) return { minDate: null, maxDate: null };
    return { minDate, maxDate: maxDate || minDate };
}

function processDailyData(data: any[], min: string | null, max: string | null) {
    const dailyMap = new Map<string, { data: string; liberado: number; enviado: number; rodando: number; criado: number }>();
    const add = (d: string | null, type: 'liberado' | 'enviado' | 'rodando' | 'criado') => {
        if (!d) return;
        const ds = d.slice(0, 10);
        if (min && max && (ds < min || ds > max)) return;
        let res = dailyMap.get(ds);
        if (!res) {
            res = { data: ds, liberado: 0, enviado: 0, rodando: 0, criado: 0 };
            dailyMap.set(ds, res);
        }
        res[type]++;
    };
    for (const item of data) {
        if (item.data_liberacao && item.status === 'Liberado') add(item.data_liberacao, 'liberado');
        if (item.data_envio && !EXCLUDED_ENVIADOS.includes(item.status)) add(item.data_envio, 'enviado');
        add(item.rodou_dia, 'rodando');
        add(item.Criado || item.created_at || item.data_envio, 'criado');
    }
    return dailyMap;
}

function fillDailyGaps(map: Map<string, any>, data: any[], min: string, max: string) {
    let lastDay = min;
    for (const item of data) {
        const candidates = [item.data_liberacao, item.data_envio, item.rodou_dia, item.Criado];
        for (const raw of candidates) {
            if (!raw) continue;
            const dateStr = raw.slice(0, 10);
            if (dateStr <= max && dateStr > lastDay) {
                lastDay = dateStr;
            }
        }
    }
    for (let c = new Date(min + 'T12:00:00'); c <= new Date(lastDay + 'T12:00:00'); c.setDate(c.getDate() + 1)) {
        const s = c.toISOString().split('T')[0];
        if (!map.has(s)) map.set(s, { data: s, liberado: 0, enviado: 0, rodando: 0, criado: 0 });
    }
}
