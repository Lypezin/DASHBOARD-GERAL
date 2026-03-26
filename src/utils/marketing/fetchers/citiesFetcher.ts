import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingCityData, MarketingDateFilter } from '@/types';
import { IS_DEV, ABERTO_STATUSES, VOLTOU_STATUSES, EXCLUDED_ENVIADOS } from '../constants';

const getMonthFilter = (filters: MarketingFilters): MarketingDateFilter | null => {
    const anyDate = filters.filtroEnviados.dataInicial || filters.filtroLiberacao.dataInicial || filters.filtroRodouDia.dataInicial || filters.filtroDataInicio.dataInicial;
    if (!anyDate) return null;
    const d = new Date(anyDate + 'T12:00:00');
    return {
        dataInicial: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
        dataFinal: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
    };
};

export async function fetchMarketingCitiesData(
    filters: MarketingFilters, 
    organizationId: string | null,
    client: SupabaseClient = supabase,
    allCities: boolean = false
): Promise<MarketingCityData[]> {
    const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        cidade: string; enviado: number; liberado: number; rodando_inicio: number;
    }>>('get_marketing_cities_data', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
        rodou_dia_inicial: filters.filtroRodouDia.dataInicial || null,
        rodou_dia_final: filters.filtroRodouDia.dataFinal || null,
        p_organization_id: organizationId,
    }, { validateParams: false, client });

    const cidadesToProcess = allCities || !filters.praca ? CIDADES : [filters.praca];
    
    if (!rpcError && rpcData && Array.isArray(rpcData) && !allCities) {
        const rpcMap = new Map(rpcData.map(item => [item.cidade, item]));
        return cidadesToProcess.map(cidade => ({ 
            cidade, criado: 0, enviado: rpcMap.get(cidade)?.enviado || 0, 
            liberado: rpcMap.get(cidade)?.liberado || 0, 
            rodandoInicio: rpcMap.get(cidade)?.rodando_inicio || 0,
            aberto: 0, voltou: 0, conversas: 0
        }));
    }

    if (IS_DEV) safeLog.info('Using manual fetch for cities data');
    const results: MarketingCityData[] = [];
    const monthFilter = getMonthFilter(filters);

    for (const cidade of cidadesToProcess) {
        const base = (sel = '*') => buildCityQuery(client.from('dados_marketing').select(sel, { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {});

        const [e, l, r, a, v, c] = await Promise.all([
            monthFilter ? buildDateFilterQuery(base().not('status', 'in', EXCLUDED_ENVIADOS).not('data_envio', 'is', null), 'data_envio', monthFilter) : base(),
            monthFilter ? buildDateFilterQuery(base().eq('status', 'Liberado').not('data_envio', 'is', null), 'data_envio', monthFilter) : base(),
            monthFilter ? buildDateFilterQuery(base().not('rodou_dia', 'is', null), 'data_envio', monthFilter) : base(),
            monthFilter ? buildDateFilterQuery(base().in('status', ABERTO_STATUSES).not('data_envio', 'is', null), 'data_envio', monthFilter) : base(),
            monthFilter ? buildDateFilterQuery(base().in('status', VOLTOU_STATUSES).not('data_envio', 'is', null), 'data_envio', monthFilter) : base(),
            monthFilter ? base().gte('Criado', monthFilter.dataInicial).lte('Criado', monthFilter.dataFinal) : base()
        ]);

        results.push({ 
            cidade, criado: c.count || 0, enviado: e.count || 0, 
            liberado: l.count || 0, rodandoInicio: r.count || 0,
            aberto: a.count || 0, voltou: v.count || 0, conversas: 0
        });
    }
    return results;
}
