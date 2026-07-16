import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingCityData } from '@/types';
import { IS_DEV, EXCLUDED_ENVIADOS } from '../constants';

export async function fetchMarketingCitiesData(
    filters: MarketingFilters, 
    organizationId: string | null,
    client: SupabaseClient = supabase,
    allCities: boolean = false
): Promise<MarketingCityData[]> {
    const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        cidade: string; enviado: number; liberado: number; rodando_inicio: number;
        aberto: number; voltou: number; criado: number;
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
    
    if (!rpcError && rpcData && Array.isArray(rpcData)) {
        const rpcMap = new Map(rpcData.map(item => [item.cidade, item]));
        return cidadesToProcess.map(cidade => ({ 
            cidade, criado: rpcMap.get(cidade)?.criado || 0, enviado: rpcMap.get(cidade)?.enviado || 0,
            liberado: rpcMap.get(cidade)?.liberado || 0, 
            rodandoInicio: rpcMap.get(cidade)?.rodando_inicio || 0,
            aberto: rpcMap.get(cidade)?.aberto || 0,
            voltou: rpcMap.get(cidade)?.voltou || 0,
            conversas: 0
        }));
    }

    if (IS_DEV) safeLog.info('Using manual fetch for cities data');
    const results: MarketingCityData[] = [];

    for (const cidade of cidadesToProcess) {
        const base = (sel = '*') => buildCityQuery(client.from('dados_marketing').select(sel, { count: 'exact', head: true }), cidade)
            .match(organizationId ? { organization_id: organizationId } : {});

        let enviadosQuery = base().not('data_envio', 'is', null);
        EXCLUDED_ENVIADOS.forEach((status) => { enviadosQuery = enviadosQuery.neq('status', status); });

        const [e, l, r, a, v, c] = await Promise.all([
            buildDateFilterQuery(enviadosQuery, 'data_envio', filters.filtroEnviados),
            buildDateFilterQuery(base().eq('status', 'Liberado').not('data_liberacao', 'is', null), 'data_liberacao', filters.filtroLiberacao),
            buildDateFilterQuery(base().not('rodou_dia', 'is', null), 'rodou_dia', filters.filtroRodouDia),
            buildDateFilterQuery(base().or('status.ilike.Aberto%,status.ilike.%aguardando liberaÃ§Ã£o%,status.ilike.%Retorno%,status.ilike.%A enviar%').not('data_envio', 'is', null), 'data_envio', filters.filtroEnviados),
            buildDateFilterQuery(base().or('status.ilike.Voltou%,status.ilike.%desistiu%,status.ilike.%bug%').not('data_envio', 'is', null), 'data_envio', filters.filtroEnviados),
            buildDateFilterQuery(base().not('Criado', 'is', null), 'Criado', filters.filtroDataInicio)
        ]);

        results.push({ 
            cidade, criado: c.count || 0, enviado: e.count || 0, 
            liberado: l.count || 0, rodandoInicio: r.count || 0,
            aberto: a.count || 0, voltou: v.count || 0, conversas: 0
        });
    }
    return results;
}
