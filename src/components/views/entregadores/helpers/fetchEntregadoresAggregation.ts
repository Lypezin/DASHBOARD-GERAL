import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { fetchEntregadoresIds, fetchCorridasBatch } from './aggregation/queries';
import { processEntregadorData } from './aggregation/processor';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadoresAggregation(
    filtroDataInicio: MarketingDateFilter,
    filtroRodouDia: MarketingDateFilter,
    cidadeSelecionada: string,
    searchTerm: string
): Promise<EntregadorMarketing[]> {

    // 1. Fetch Entregadores
    const entregadores = await fetchEntregadoresIds(cidadeSelecionada, searchTerm, filtroRodouDia);
    if (!entregadores.length) return [];

    const idsEntregadores = entregadores.map(e => e.id_entregador).filter((id): id is string => !!id);
    if (!idsEntregadores.length) return [];

    // 2. Fetch Corridas in Parallel Batches
    const todasCorridas = await fetchCorridasBatch(idsEntregadores);

    // 3. Map Corridas by Entregador
    const corridasMap = new Map<string, any[]>();
    todasCorridas.forEach(c => {
        const id = c.id_da_pessoa_entregadora;
        if (!id) return;
        if (!corridasMap.has(id)) corridasMap.set(id, []);
        corridasMap.get(id)!.push(c);
    });

    // 4. Process Data
    const result: EntregadorMarketing[] = [];
    for (const ent of entregadores) {
        const processed = processEntregadorData(
            ent,
            filtroDataInicio,
            filtroRodouDia,
            corridasMap.get(ent.id_entregador) || []
        );
        if (processed) result.push(processed);
    }

    result.sort((a, b) => a.nome.localeCompare(b.nome));

    if (IS_DEV) safeLog.info(`✅ ${result.length} entregadores processed.`);
    return result;
}
