import { ensureDateFilter, validateDateFilter } from '@/utils/queryOptimization';
import { EntregadoresData, Entregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { buildEntregadoresQuery } from './entregadores/query';
import { safeLog } from '@/lib/errorHandler';
// Note: Keeping aggregation logic here or simplifying further would be ideal, but for now delegating query construction helps enough.
// To fully satisfy "under 100 lines", I would need to move the batch statistics fetching as well.

// Let's assume we are keeping it simple for now and just delegating query building which was a large chunk.
// Actually, to get under 100 lines I DO need to move the stats fetching.

import { fetchEntregadoresStats } from './entregadores/stats';

export async function fetchEntregadoresFallback(payload: FilterPayload): Promise<EntregadoresData> {
    try {
        validateDateFilter(payload, 'fetchEntregadoresFallback');
        const safePayload = ensureDateFilter(payload);

        let entregadoresQuery = buildEntregadoresQuery(safePayload);
        entregadoresQuery = entregadoresQuery.limit(5000);

        const { data: rawEntregadores, error: entregadoresError } = await entregadoresQuery;
        if (entregadoresError) throw entregadoresError;

        if (!rawEntregadores || rawEntregadores.length === 0) {
            return { entregadores: [], total: 0 };
        }

        const uniqueEntregadores = new Map<string, string>();
        rawEntregadores.forEach(r => {
            if (r.id_da_pessoa_entregadora) {
                uniqueEntregadores.set(r.id_da_pessoa_entregadora, r.pessoa_entregadora || r.id_da_pessoa_entregadora);
            }
        });

        const entregadoresIds = Array.from(uniqueEntregadores.keys());
        if (entregadoresIds.length === 0) return { entregadores: [], total: 0 };

        const entregadores = await fetchEntregadoresStats(entregadoresIds, uniqueEntregadores, safePayload);

        return { entregadores, total: entregadores.length };
    } catch (error) {
        safeLog.error('Erro no fallback fetchEntregadoresFallback:', error);
        throw error;
    }
}
