import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { postUploadApi } from '@/utils/upload/fetchUploadApi';

export async function deleteAllRecords(
    table: string,
    options: { organizationId?: string; requireOrganization?: boolean } = {}
): Promise<number> {
    safeLog.info(`Iniciando remocao de dados antigos da tabela ${table}...`);
    const { organizationId, requireOrganization = false } = options;

    if (requireOrganization && !isValidUuid(organizationId)) {
        throw new Error('Organizacao invalida ou nao selecionada. A remocao foi bloqueada por seguranca.');
    }

    if (table === 'dados_marketing' || table === 'dados_valores_cidade') {
        const { ok, status, payload } = await postUploadApi<{ deleted?: number }>(
            '/api/upload/table-delete',
            { table, organizationId }
        );

        if (!ok) {
            throw new Error(payload?.error || payload?.message || `Erro HTTP ${status} ao remover dados de ${table}.`);
        }

        const deleted = Number(payload?.deleted || 0);
        safeLog.info(`Removidos ${deleted} registros via API interna`);
        return deleted;
    }

    return await deleteInBatches(table, organizationId);
}

async function deleteInBatches(table: string, organizationId?: string): Promise<number> {
    let deletedCount = 0;
    let hasMore = true;
    const batchSize = 500;

    while (hasMore) {
        let query = supabase
            .from(table)
            .select('id')
            .limit(batchSize);

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data: batch, error: fetchErr } = await query;

        if (fetchErr) throw new Error(`Erro buscar dados para deletar: ${fetchErr.message}`);
        if (!batch || batch.length === 0) {
            hasMore = false;
            break;
        }

        const ids = batch.map((item) => item.id);
        const { error: delErr } = await supabase.from(table).delete().in('id', ids);

        if (delErr) throw new Error(`Erro deletar lote: ${delErr.message}`);

        deletedCount += ids.length;
        safeLog.info(`Deletados: ${deletedCount}`);

        if (batch.length < batchSize) hasMore = false;
    }

    return deletedCount;
}

function isValidUuid(value?: string): value is string {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
