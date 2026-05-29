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
    rpcFunctionName?: string,
    options: { organizationId?: string; requireOrganization?: boolean } = {}
): Promise<number> {
    safeLog.info(`Iniciando remoção de dados antigos da tabela ${table}...`);
    const { organizationId, requireOrganization = false } = options;

    if (requireOrganization && !isValidUuid(organizationId)) {
        throw new Error('Organização inválida ou não selecionada. A remoção foi bloqueada por segurança.');
    }

    if (rpcFunctionName) {
        try {
            const rpcParams = organizationId ? { p_organization_id: organizationId } : undefined;
            const { data: deletedCount, error } = await supabase.rpc(rpcFunctionName, rpcParams);
            if (!error) {
                safeLog.info(`✅ Removidos ${deletedCount || 0} registros via RPC`);
                return deletedCount || 0;
            }
            if (!isMissingRpcSignatureError(error)) {
                throw new Error(`Erro RPC delete: ${error.message}`);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (isMissingRpcSignatureError(err)) {
                safeLog.info('RPC não disponível para remoção escopada, usando fallback seguro...');
            } else {
                safeLog.error(`Erro ao deletar dados de ${table} via RPC: ${errorMessage}`, 'dataDeletion');
                throw err;
            }
        }
    }

    return await deleteInBatches(table, organizationId);
}

async function deleteInBatches(table: string, organizationId?: string): Promise<number> {
    let deletedCount = 0;
    let hasMore = true;
    const BATCH_SIZE = 500;

    while (hasMore) {
        let query = supabase
            .from(table)
            .select('id')
            .limit(BATCH_SIZE);

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data: batch, error: fetchErr } = await query;

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

function isValidUuid(value?: string): value is string {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isMissingRpcSignatureError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { code?: string; message?: string };
    return (
        maybeError.code === 'PGRST116' ||
        maybeError.code === 'PGRST202' ||
        maybeError.message?.toLowerCase().includes('could not find the function') === true
    );
}
