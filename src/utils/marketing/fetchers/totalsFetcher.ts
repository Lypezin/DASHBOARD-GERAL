import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { MarketingFilters, MarketingTotals } from '@/types';
import { IS_DEV, ABERTO_STATUSES, VOLTOU_STATUSES } from '../constants';

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

    const applyBaseFilters = (q: any) => {
        let filtered = q.match(organizationId ? { organization_id: organizationId } : {});
        if (filters.praca) filtered = buildCityQuery(filtered, filters.praca);
        return filtered;
    };

    const [abertoQuery, voltouQuery, criadoQuery, enviadoQuery, liberadoQuery, rodandoQuery] = await Promise.all([
        (async () => {
            let q = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
                .not('data_envio', 'is', null).in('status', ABERTO_STATUSES);
            if (filters.filtroEnviados.dataInicial) q = buildDateFilterQuery(q, 'data_envio', filters.filtroEnviados);
            return (await q).count;
        })(),
        (async () => {
            let q = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
                .not('data_envio', 'is', null).in('status', VOLTOU_STATUSES);
            if (filters.filtroEnviados.dataInicial) q = buildDateFilterQuery(q, 'data_envio', filters.filtroEnviados);
            return (await q).count;
        })(),
        (async () => (await applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
            .or('Criado.not.is.null,created_at.not.is.null,data_envio.not.is.null')).count)(),
        (async () => {
            let q = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
                .not('status', 'in', `('Confirmar','Cancelado','Abrindo MEI')`).not('data_envio', 'is', null);
            if (filters.filtroEnviados.dataInicial) q = buildDateFilterQuery(q, 'data_envio', filters.filtroEnviados);
            return (await q).count;
        })(),
        (async () => {
            let q = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
                .eq('status', 'Liberado').not('data_liberacao', 'is', null);
            if (filters.filtroLiberacao.dataInicial) q = buildDateFilterQuery(q, 'data_liberacao', filters.filtroLiberacao);
            return (await q).count;
        })(),
        (async () => {
            let q = applyBaseFilters(client.from('dados_marketing').select('*', { count: 'exact', head: true }))
                .not('rodou_dia', 'is', null);
            if (filters.filtroRodouDia.dataInicial) q = buildDateFilterQuery(q, 'rodou_dia', filters.filtroRodouDia);
            return (await q).count;
        })(),
    ]);

    return { 
        criado: criadoQuery || 0, enviado: enviadoQuery || 0, liberado: liberadoQuery || 0, 
        rodandoInicio: rodandoQuery || 0, aberto: abertoQuery || 0, voltou: voltouQuery || 0
    };
}
