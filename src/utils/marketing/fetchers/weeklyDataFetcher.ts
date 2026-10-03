import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getMondayOfIsoWeek, getWeekKey, getWeekLabel } from '../dateUtils';
import { EXCLUDED_ENVIADOS } from '../constants';
import { SANTO_ANDRE_SUB_PRACAS, SAO_BERNARDO_SUB_PRACAS } from '@/constants/marketing';
import { fetchAllMarketingRows } from './queryErrors';

type WeeklyMetrics = {
    semana: string;
    criado: number;
    enviado: number;
    liberado: number;
    rodando: number;
    conversas: number;
};

type WeeklyMarketingRow = {
    Criado: string | null;
    created_at: string | null;
    data_envio: string | null;
    data_liberacao: string | null;
    rodou_dia: string | null;
    status: string | null;
    conversas: number | null;
    regiao_atuacao: string | null;
    sub_praca_abc: string | null;
};

type WeeklyCostRow = {
    data: string;
    conversas: number | null;
    cidade: string | null;
};

type WeekBucket = Omit<WeeklyMetrics, 'semana'>;

export async function fetchMarketingWeeklyData(
    organizationId: string | null,
    cities: string[],
    startDate: string | null = null,
    endDate: string | null = null,
    client: SupabaseClient = supabase
): Promise<{
    overall: WeeklyMetrics[];
    byCity: Array<{ cidade: string; data: WeeklyMetrics[] }>;
}> {
    const end = endDate ? new Date(endDate) : new Date();
    const rawStart = startDate ? new Date(startDate) : (date => {
        date.setDate(date.getDate() - 56);
        return date;
    })(new Date(end));
    const startOfFirstWeek = getMondayOfIsoWeek(rawStart);
    const endOfLastWeek = getMondayOfIsoWeek(end);
    const minStart = (date => {
        date.setDate(date.getDate() - 56);
        return date;
    })(new Date(endOfLastWeek));
    const finalStart = startDate ? startOfFirstWeek : minStart;
    const startIso = finalStart.toISOString().split('T')[0];
    const endIso = end.toISOString().split('T')[0];

    const [marketingRows, costRows] = await Promise.all([
        fetchAllMarketingRows<WeeklyMarketingRow>(
            'Erro ao carregar a comparação semanal de Marketing.',
            (from, to, includeExactCount) => {
                let query = client.from('dados_marketing').select(
                    'id, Criado, created_at, data_envio, data_liberacao, rodou_dia, status, conversas, regiao_atuacao, sub_praca_abc',
                    includeExactCount ? { count: 'exact' } : undefined
                );
                if (organizationId) query = query.eq('organization_id', organizationId);
                query = query.or([
                    `data_envio.gte.${startIso}`,
                    `data_liberacao.gte.${startIso}`,
                    `created_at.gte.${startIso}`,
                    `Criado.gte.${startIso}`,
                    `rodou_dia.gte.${startIso}`,
                ].join(','));
                query = query.or([
                    `data_envio.lte.${endIso}`,
                    `data_liberacao.lte.${endIso}`,
                    `created_at.lte.${endIso}`,
                    `Criado.lte.${endIso}`,
                    `rodou_dia.lte.${endIso}`,
                ].join(','));
                return query.order('id', { ascending: true }).range(from, to);
            }
        ),
        fetchAllMarketingRows<WeeklyCostRow>(
            'Erro ao carregar as conversas da comparação semanal.',
            (from, to, includeExactCount) => {
                let query = client.from('dados_valores_cidade').select(
                    'id, data, conversas, cidade',
                    includeExactCount ? { count: 'exact' } : undefined
                );
                if (organizationId) query = query.eq('organization_id', organizationId);
                return query.gte('data', startIso).lte('data', endIso)
                    .order('id', { ascending: true }).range(from, to);
            }
        ),
    ]);

    const overallMap = initializeWeekMap(finalStart, endOfLastWeek);
    marketingRows.forEach(row => addMarketingRow(row, overallMap));
    costRows.forEach(row => addCostRow(row, overallMap));

    const byCity = cities.map(cidade => {
        const cityMap = initializeWeekMap(finalStart, endOfLastWeek);
        marketingRows.forEach(row => {
            if (isItemFromCity(row, cidade)) addMarketingRow(row, cityMap);
        });
        costRows.forEach(row => {
            if (isCostFromCity(row, cidade)) addCostRow(row, cityMap);
        });

        return { cidade, data: toWeeklyMetrics(cityMap) };
    });

    return { overall: toWeeklyMetrics(overallMap), byCity };
}

function initializeWeekMap(start: Date, end: Date) {
    const map = new Map<string, WeekBucket>();
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 7)) {
        const key = getWeekKey(date);
        if (!map.has(key)) map.set(key, { criado: 0, enviado: 0, liberado: 0, rodando: 0, conversas: 0 });
    }
    return map;
}

function toWeeklyMetrics(map: Map<string, WeekBucket>): WeeklyMetrics[] {
    return Array.from(map, ([key, values]) => ({ ...values, semana: getWeekLabel(key) }));
}

function addByDate(date: string | null, metric: keyof WeekBucket, map: Map<string, WeekBucket>, amount = 1) {
    if (!date) return;
    const parsedDate = new Date(date.length === 10 ? `${date}T12:00:00` : date);
    const bucket = map.get(getWeekKey(parsedDate));
    if (bucket) bucket[metric] += amount;
}

function addMarketingRow(row: WeeklyMarketingRow, map: Map<string, WeekBucket>) {
    addByDate(row.Criado || row.created_at || row.data_envio, 'criado', map);

    if (row.data_envio) {
        if (!EXCLUDED_ENVIADOS.includes(row.status || '')) addByDate(row.data_envio, 'enviado', map);
    }

    if (row.data_liberacao && row.status === 'Liberado') addByDate(row.data_liberacao, 'liberado', map);
    addByDate(row.rodou_dia, 'rodando', map);
    if (row.conversas) {
        addByDate(row.data_envio || row.created_at || row.data_liberacao, 'conversas', map, Number(row.conversas) || 0);
    }
}

function addCostRow(row: WeeklyCostRow, map: Map<string, WeekBucket>) {
    if (row.conversas) addByDate(row.data, 'conversas', map, Number(row.conversas) || 0);
}

function normalize(value: string | null) {
    return (value || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isItemFromCity(item: WeeklyMarketingRow, city: string) {
    const itemRegion = normalize(item.regiao_atuacao);
    const subPraca = (item.sub_praca_abc || '').trim();
    const target = normalize(city);

    if (city === 'Santo André') {
        const isABC = itemRegion === 'ABC 2.0';
        return isABC && SANTO_ANDRE_SUB_PRACAS.includes(subPraca as any);
    }
    if (city === 'São Bernardo') {
        const isABC = itemRegion === 'ABC 2.0';
        return isABC && SAO_BERNARDO_SUB_PRACAS.includes(subPraca as any);
    }
    if (city === 'ABC 2.0') return itemRegion.includes('ABC');

    const targetBase = target.replace(' 2.0', '');
    return itemRegion.includes(targetBase);
}

function isCostFromCity(item: WeeklyCostRow, city: string) {
    const itemCity = normalize(item.cidade);
    const target = normalize(city);
    if (city === 'ABC 2.0') {
        return ['ABC', 'ABC 2.0', 'SANTO ANDRÉ', 'SÃO BERNARDO', 'SANTO ANDRE', 'SAO BERNARDO'].includes(itemCity);
    }
    return itemCity.includes(target.replace(' 2.0', ''));
}
