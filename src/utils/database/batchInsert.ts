import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { BATCH_SIZE } from '@/constants/upload';

export interface BatchInsertOptions { batchSize?: number; onProgress?: (inserted: number, total: number) => void; returnData?: boolean; organizationId?: string; }

export async function insertInBatches<T extends Record<string, unknown> = Record<string, unknown>>(table: string, data: T[], options: BatchInsertOptions = {}): Promise<{ inserted: number; errors: string[] }> {
    const { batchSize = BATCH_SIZE, onProgress, returnData = false, organizationId } = options;
    const totalRows = data.length, errors: string[] = [];
    let insertedRows = 0;
    const useRpc = table === 'dados_marketing' || table === 'dados_corridas';
    const rpcName = useRpc ? (table === 'dados_marketing' ? 'insert_dados_marketing_batch' : 'insert_dados_corridas_batch') : null;

    safeLog.info(`Iniciando inserção em lotes na tabela ${table}...`);

    for (let i = 0; i < totalRows; i += batchSize) {
        let batch = data.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        if (organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
            batch = batch.map(item => ({ ...item, organization_id: organizationId }));
        }

        try {
            if (useRpc && rpcName) await insertViaRpc(table, batch, rpcName, batchNumber, errors);
            else {
                const query = supabase.from(table).insert(batch as any, { count: 'exact' });
                if (returnData) query.select();
                const { error } = await query;
                if (error) throw new Error(`Erro insert direto: ${error.message}`);
            }
            insertedRows += batch.length;
            if (onProgress) onProgress(insertedRows, totalRows);
        } catch (error: any) {
            errors.push(error?.message || `Erro desconhecido lote ${batchNumber}`);
            safeLog.error(`Erro no lote ${batchNumber}:`, error);
            if (error?.code === '23505' || error?.code === '23503') throw error;
        }
    }

    safeLog.info(`Inserção concluída: ${insertedRows}/${totalRows}`);
    if (errors.length > 0) safeLog.warn(`Erros encontrados: ${errors.length}`);
    return { inserted: insertedRows, errors };
}

async function insertViaRpc(table: string, batch: any[], rpcName: string, batchNum: number, errors: string[]) {
    const dadosJsonb = batch.map(item => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? null])));
    const { data: rpcResult, error: rpcError } = await supabase.rpc(rpcName, { dados: dadosJsonb });

    if (rpcError) {
        if (['PGRST301', 'PGRST116'].includes(rpcError.code) || rpcError.message?.includes('403')) {
            safeLog.warn(`Fallback para inserção direta no lote ${batchNum}`);
            const { error: directErr } = await supabase.from(table).insert(batch as any, { count: 'exact' });
            if (directErr) throw new Error(`Erro insert fallback: ${directErr.message}`);
            return;
        }
        throw new Error(`Erro RPC ${rpcName}: ${rpcError.message}`);
    }

    const { errors: errCount, error_messages } = (rpcResult || {}) as any;
    if (errCount > 0) error_messages?.forEach((msg: string) => errors.push(`Lote ${batchNum}: ${msg}`));
}
