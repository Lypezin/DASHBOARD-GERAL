import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingCostsComparison, MarketingCostData } from '@/types';
import { SLIDE_CITIES, DISPLAY_CITY_TO_DB_CITY, PRIORITY_CITIES, ABERTO_STATUSES } from '../constants';
import { ATENDENTE_TO_ID, REGIAO_TO_CIDADE_VALORES } from '../../atendenteMappers';

export async function fetchMarketingCostsComparison(
    filters: MarketingFilters,
    organizationId: string | null,
    client: SupabaseClient = supabase
): Promise<MarketingCostsComparison> {
    const currentStart = filters.filtroEnviados.dataInicial;
    const currentEnd = filters.filtroEnviados.dataFinal;
    if (!currentStart || !currentEnd) return { atual: [], passada: [] };

    const endRef = new Date(currentEnd + 'T12:00:00');
    const day = endRef.getDay(); // 0 Sunday, 1 Monday, ..., 3 Wednesday, ...
    
    // Calcula a quarta-feira mais recente (menor ou igual ao endRef)
    const diff = (day === 3) ? 0 : (day > 3 ? day - 3 : day + 4);
    const targetWednesday = new Date(endRef); 
    targetWednesday.setDate(endRef.getDate() - diff);

    // Calcula a quarta-feira da semana anterior
    const previousWednesday = new Date(targetWednesday);
    previousWednesday.setDate(targetWednesday.getDate() - 7);

    // Data de início fixada no dia 01 do mês da dataInicial
    const [year, month] = currentStart.split('-');
    const sISO = `${year}-${month}-01`;

    const eAtualISO = targetWednesday.toISOString().split('T')[0];
    const ePassadaISO = previousWednesday.toISOString().split('T')[0];

    const [atual, passada] = await Promise.all([
        fetchRange(sISO, eAtualISO, organizationId, client),
        fetchRange(sISO, ePassadaISO, organizationId, client)
    ]);

    return { atual, passada };
}

async function fetchRange(sISO: string, eISO: string, orgId: string | null, client: SupabaseClient): Promise<MarketingCostData[]> {
    const cityMap = new Map<string, any>();
    const allMarketingIds = Object.values(ATENDENTE_TO_ID).flat();

    let costQ = client.from('dados_valores_cidade').select('valor, cidade, id_atendente, organization_id, conversas')
        .gte('data', sISO).lte('data', eISO).in('id_atendente', allMarketingIds);
    if (orgId) costQ = costQ.eq('organization_id', orgId);
    const { data: allCosts } = await costQ;

    await Promise.all(SLIDE_CITIES.map(async (name) => {
        const { valor, convs } = aggregateCityCosts(name, allCosts || []);
        const metrics = await fetchCityMetricsForRange(name, sISO, eISO, orgId, client);
        cityMap.set(name, { regiao: name.replace(' 2.0', ''), valorUsado: valor, ...metrics, conversas: convs });
    }));

    return finalizeRangeData(cityMap, allCosts || []);
}

function aggregateCityCosts(name: string, costs: any[]) {
    let valor = 0, convs = 0;
    const norm = name.toUpperCase().trim();
    const db = REGIAO_TO_CIDADE_VALORES[name];
    costs.forEach(r => {
        const rc = (r.cidade || '').toUpperCase().trim();
        let m = false;
        if (name === 'ABC 2.0') m = ['ABC', 'ABC 2.0', 'SANTO ANDRÉ', 'SÃO BERNARDO', 'SANTO ANDRE', 'SAO BERNARDO'].includes(rc);
        else if (norm.includes('TABOÃO')) m = rc.includes('TABOÃO') || rc.includes('TABOAO');
        else m = rc === norm || rc === db || rc.replace(' 2.0', '').trim() === norm.replace(' 2.0', '').trim();
        if (m) { valor += Number(r.valor) || 0; convs += Number(r.conversas) || 0; }
    });
    return { valor, convs };
}

async function fetchCityMetricsForRange(name: string, s: string, e: string, orgId: string | null, client: SupabaseClient) {
    const fetch = async (c: string): Promise<{ l: number; r: number; a: number }> => {
        const q = (base = client.from('dados_marketing').select('*', { count: 'exact', head: true })) => 
            buildCityQuery(orgId ? base.eq('organization_id', orgId) : base, c);
        const [l, r, a] = await Promise.all([
            q().eq('status', 'Liberado').gte('data_envio', s).lte('data_envio', e),
            q().not('rodou_dia', 'is', null).gte('rodou_dia', s).lte('rodou_dia', e),
            q().in('status', ABERTO_STATUSES).gte('data_envio', s).lte('data_envio', e),
        ]);
        return { l: l.count || 0, r: r.count || 0, a: a.count || 0 };
    };
    if (name === 'ABC 2.0') {
        const [m1, m2] = await Promise.all([fetch('Santo André'), fetch('São Bernardo')]);
        return { liberado: m1.l + m2.l, rodando: m1.r + m2.r, aberto: m1.a + m2.a };
    }
    const m = await fetch(name); return { liberado: m.l, rodando: m.r, aberto: m.a };
}

function finalizeRangeData(map: Map<string, any>, costs: any[]) {
    const result: MarketingCostData[] = [];
    map.forEach(v => result.push({ ...v, cpa: v.rodando > 0 ? v.valorUsado / v.rodando : 0 }));
    let oV = 0;
    costs.forEach(r => {
        const rc = (r.cidade || '').toUpperCase().trim();
        const m = SLIDE_CITIES.some(n => {
            const norm = n.toUpperCase().trim(); const db = REGIAO_TO_CIDADE_VALORES[n];
            if (n === 'ABC 2.0') return ['ABC', 'ABC 2.0', 'SANTO ANDRÉ', 'SÃO BERNARDO', 'SANTO ANDRE', 'SAO BERNARDO'].includes(rc);
            return rc === norm || rc === db || rc.replace(' 2.0', '').trim() === norm.replace(' 2.0', '').trim();
        });
        if (!m) oV += Number(r.valor) || 0;
    });
    if (oV > 0) result.push({ regiao: 'Outros', valorUsado: oV, rodando: 0, liberado: 0, aberto: 0, conversas: 0, cpa: 0 });
    return result.sort((a,b) => PRIORITY_CITIES.indexOf(a.regiao) - PRIORITY_CITIES.indexOf(b.regiao));
}
