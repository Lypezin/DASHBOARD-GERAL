import { safeLog } from '@/lib/errorHandler';
import { ensureDateFilter, validateDateFilter } from '@/utils/queryOptimization';
import { UtrData } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { buildUtrQuery } from './utrQueryBuilder';
import { processUtrData } from './utrAggregator';

/**
 * Fallback: Busca dados de UTR diretamente da tabela dados_corridas
 */
export async function fetchUtrFallback(payload: FilterPayload): Promise<UtrData | null> {
    try {
        validateDateFilter(payload, 'fetchUtrFallback');
        const safePayload = ensureDateFilter(payload);

        let query = buildUtrQuery(safePayload);

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return processUtrData(data);

    } catch (error) {
        safeLog.error('Erro no fallback fetchUtrFallback:', error);
        throw error;
    }
}
