import { safeLog } from '@/lib/errorHandler';
import { validateDateFilter } from '@/utils/queryOptimization';
import { ValoresEntregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { buildValoresQuery, processValoresData } from './valoresHelpers';

/**
 * Fallback: Busca dados de valores diretamente da tabela dados_corridas
 */
export async function fetchValoresFallback(payload: FilterPayload): Promise<ValoresEntregador[]> {
    try {
        validateDateFilter(payload, 'fetchValoresFallback');
        const query = buildValoresQuery(payload);
        const { data, error } = await query;

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        const valoresItems = processValoresData(data);

        return valoresItems.map(item => ({
            id_entregador: item.id_entregador,
            nome_entregador: item.nome_entregador,
            total_taxas: item.total_taxas,
            numero_corridas_aceitas: item.numero_corridas_aceitas,
            taxa_media: item.numero_corridas_aceitas > 0
                ? item.total_taxas / item.numero_corridas_aceitas
                : 0,
        }));
    } catch (error) {
        safeLog.error('Erro no fallback fetchValoresFallback:', error);
        throw error;
    }
}
