/**
 * Utilitários para remoção de dados do banco de dados.
 */

import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

/**
 * Deleta todos os registros de uma tabela usando função RPC ou fallback.
 */
export async function deleteAllRecords(
    table: string,
    rpcFunctionName?: string
): Promise<number> {
    safeLog.info(`Iniciando remoção de dados antigos da tabela ${table}...`);

    if (rpcFunctionName) {
        try {
            const { data: deletedCount, error } = await supabase.rpc(rpcFunctionName);
            if (!error) {
                safeLog.info(`✅ Removidos ${deletedCount || 0} registros via RPC`);
                return deletedCount || 0;
            }
            if (error.code !== 'PGRST116') {
                throw new Error(`Erro RPC delete: ${error.message}`);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            // Check if the error is PGRST116 (RPC not found/available)
            // If not, log the error and re-throw it.
            // If it is, log the fallback message.
            if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'PGRST116') {
                safeLog.info('RPC não disponível, usando fallback...');
            } else {
                safeLog.error(`Erro ao deletar dados de ${table} via RPC: ${errorMessage}`, 'dataDeletion');
                throw err; // Re-throw other unexpected errors
            }
        }
    }

    return await deleteInBatches(table);
}

async function deleteInBatches(table: string): Promise<number> {
    let deletedCount = 0;
    let hasMore = true;
    const BATCH_SIZE = 500;

    while (hasMore) {
        const { data: batch, error: fetchErr } = await supabase
            .from(table)
            .select('id')
            .limit(BATCH_SIZE);

        if (fetchErr) throw new Error(`Erro buscar dados para deletar: ${fetchErr.message}`);
        if (!batch || batch.length === 0) {
            hasMore = false;
            break;
        }

        const ids = batch.map(i => i.id);
        const { error: delErr } = await supabase.from(table).delete().in('id', ids);

        if (delErr) throw new Error(`Erro deletar lote: ${delErr.message}`);

        deletedCount += ids.length;
        safeLog.info(`Deletados: ${deletedCount}`);

        if (batch.length < BATCH_SIZE) hasMore = false;
    }

    return deletedCount;
}
