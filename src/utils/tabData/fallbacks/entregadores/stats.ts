import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { Entregador } from '@/types';
import { FilterPayload } from '@/types/filters';
import { QUERY_LIMITS } from '@/constants/config';

export async function fetchEntregadoresStats(
    entregadoresIds: string[],
    uniqueEntregadores: Map<string, string>,
    safePayload: FilterPayload
): Promise<Entregador[]> {
    const BATCH_SIZE = 50;
    const entregadoresMap = new Map<string, any>();

    entregadoresIds.forEach(id => {
        entregadoresMap.set(id, {
            id_entregador: id,
            nome_entregador: uniqueEntregadores.get(id) || id,
            corridas_ofertadas: 0,
            corridas_aceitas: 0,
            corridas_rejeitadas: 0,
            corridas_completadas: 0,
            tempo_total: 0
        });
    });

    for (let i = 0; i < entregadoresIds.length; i += BATCH_SIZE) {
        const batchIds = entregadoresIds.slice(i, i + BATCH_SIZE);
        let statsQuery = supabase
            .from('dados_corridas')
            .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_rejeitadas, numero_de_corridas_completadas, tempo_disponivel_escalado')
            .in('id_da_pessoa_entregadora', batchIds);

        const semanas = Array.isArray(safePayload.p_semanas)
            ? safePayload.p_semanas.map(Number).filter(Number.isFinite)
            : [];

        if (safePayload.p_ano && semanas.length > 0) {
            statsQuery = statsQuery.eq('ano_iso', safePayload.p_ano).in('semana_numero', semanas);
        } else if (safePayload.p_ano && safePayload.p_semana) {
            statsQuery = statsQuery.eq('ano_iso', safePayload.p_ano).eq('semana_numero', safePayload.p_semana);
        } else if (safePayload.p_ano) {
            statsQuery = statsQuery.eq('ano_iso', safePayload.p_ano);
        }

        if (safePayload.p_data_inicial) statsQuery = statsQuery.gte('data_do_periodo', safePayload.p_data_inicial);
        if (safePayload.p_data_final) statsQuery = statsQuery.lte('data_do_periodo', safePayload.p_data_final);

        if (safePayload.p_praca) {
            const pracas = String(safePayload.p_praca).split(',').map((p) => p.trim()).filter(Boolean);
            if (pracas.length > 0) statsQuery = statsQuery.in('praca', pracas);
        }

        if (safePayload.p_sub_praca) {
            const subPracas = String(safePayload.p_sub_praca).split(',').map((p) => p.trim()).filter(Boolean);
            if (subPracas.length > 0) statsQuery = statsQuery.in('sub_praca', subPracas);
        }

        if (safePayload.p_origem) {
            const origens = String(safePayload.p_origem).split(',').map((o) => o.trim()).filter(Boolean);
            if (origens.length > 0) statsQuery = statsQuery.in('origem', origens);
        }

        if (safePayload.p_only_dedicados) {
            statsQuery = statsQuery.ilike('origem', '%dedic%');
        }

        statsQuery = statsQuery.limit(QUERY_LIMITS.AGGREGATION_MAX);

        const { data: batchData, error: batchError } = await statsQuery;

        if (batchError) {
            safeLog.error('Erro batch stats:', batchError);
            continue;
        }

        if (batchData) {
            for (const row of batchData) {
                const id = row.id_da_pessoa_entregadora;
                if (!id || !entregadoresMap.has(id)) continue;
                const existing = entregadoresMap.get(id);
                existing.corridas_ofertadas += Number(row.numero_de_corridas_ofertadas) || 0;
                existing.corridas_aceitas += Number(row.numero_de_corridas_aceitas) || 0;
                existing.corridas_rejeitadas += Number(row.numero_de_corridas_rejeitadas) || 0;
                existing.corridas_completadas += Number(row.numero_de_corridas_completadas) || 0;

                const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
                const [h, m, s] = tempoStr.split(':').map(Number);
                existing.tempo_total += (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
            }
        }
    }

    return Array.from(entregadoresMap.values()).map(item => {
        const tempoHoras = item.tempo_total / 3600;
        const horasEntregues = item.corridas_completadas > 0 ? (item.corridas_completadas / (item.corridas_aceitas || 1)) * tempoHoras : 0;
        const aderencia = tempoHoras > 0 ? (horasEntregues / tempoHoras) * 100 : 0;
        const rejeicao = item.corridas_ofertadas > 0 ? (item.corridas_rejeitadas / item.corridas_ofertadas) * 100 : 0;

        return {
            id_entregador: item.id_entregador,
            nome_entregador: item.nome_entregador,
            corridas_ofertadas: item.corridas_ofertadas,
            corridas_aceitas: item.corridas_aceitas,
            corridas_rejeitadas: item.corridas_rejeitadas,
            corridas_completadas: item.corridas_completadas,
            aderencia_percentual: Math.round(aderencia * 100) / 100,
            rejeicao_percentual: Math.round(rejeicao * 100) / 100,
            total_segundos: item.tempo_total
        };
    });
}
