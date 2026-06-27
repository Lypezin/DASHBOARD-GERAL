import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { BATCH_SIZE } from '@/constants/upload';
import { postUploadApi } from '@/utils/upload/fetchUploadApi';

export interface BatchInsertOptions {
    batchSize?: number;
    onProgress?: (inserted: number, total: number) => void;
    returnData?: boolean;
    organizationId?: string;
}

export class NonRetryableBatchInsertError extends Error {
    readonly nonRetryable = true;
    readonly code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.name = 'NonRetryableBatchInsertError';
        this.code = code;
    }
}

export function isNonRetryableBatchInsertError(error: unknown): error is NonRetryableBatchInsertError {
    return error instanceof NonRetryableBatchInsertError ||
        (typeof error === 'object' &&
            error !== null &&
            ((error as { nonRetryable?: unknown }).nonRetryable === true ||
                (error as { code?: unknown }).code === 'SERVER_SUPABASE_SERVICE_ROLE_MISSING'));
}

export async function insertInBatches<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string,
    data: T[],
    options: BatchInsertOptions = {}
): Promise<{ inserted: number; errors: string[] }> {
    const { batchSize = BATCH_SIZE, onProgress, returnData = false, organizationId } = options;
    const totalRows = data.length;
    const errors: string[] = [];
    let insertedRows = 0;
    const useInternalUploadApi = table === 'dados_marketing' || table === 'dados_valores_cidade';

    safeLog.info(`Iniciando insercao em lotes na tabela ${table}...`);

    for (let i = 0; i < totalRows; i += batchSize) {
        let batch = data.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        if (organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
            batch = batch.map((item) => ({ ...item, organization_id: organizationId }));
        }

        try {
            if (table === 'dados_corridas') {
                await insertCorridasViaApi(batch, organizationId, batchNumber, errors);
            } else if (useInternalUploadApi) {
                await insertTableViaApi(table, batch, organizationId, batchNumber, errors);
            } else {
                const query = supabase.from(table).insert(batch as never[], { count: 'exact' });

                if (returnData) query.select();

                const { error } = await query;
                if (error) throw new Error(`Erro insert direto: ${error.message}`);
            }

            insertedRows += batch.length;
            if (onProgress) onProgress(insertedRows, totalRows);
        } catch (error: unknown) {
            if (isNonRetryableBatchInsertError(error)) {
                safeLog.error(`Erro nao recuperavel no lote ${batchNumber}:`, error);
                throw error;
            }

            const errorMessage = error instanceof Error ? error.message : `Erro desconhecido lote ${batchNumber}`;
            errors.push(errorMessage);
            safeLog.error(`Erro no lote ${batchNumber}:`, error);

            const code = typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined;
            if (code === '23505' || code === '23503') throw error;
        }
    }

    safeLog.info(`Insercao concluida: ${insertedRows}/${totalRows}`);
    if (errors.length > 0) safeLog.warn(`Erros encontrados: ${errors.length}`);

    return { inserted: insertedRows, errors };
}

async function insertCorridasViaApi(
    batch: Record<string, unknown>[],
    organizationId: string | undefined,
    batchNum: number,
    errors: string[]
) {
    const dados = batch.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value ?? null])));
    const { ok, status, payload } = await postUploadApi<{
        errors?: number;
        error_messages?: string[];
    }>('/api/upload/corridas-batch', {
        dados,
        organizationId,
    });

    if (!ok) {
        const message = payload?.error || payload?.message || `Erro HTTP ${status} no lote ${batchNum}`;
        const code = typeof payload?.code === 'string' ? payload.code : undefined;

        if (status === 503 || code === 'SERVER_SUPABASE_SERVICE_ROLE_MISSING') {
            throw new NonRetryableBatchInsertError(message, code || 'UPLOAD_SERVER_UNAVAILABLE');
        }

        throw new Error(message);
    }

    const errCount = Number(payload?.errors || 0);
    if (errCount > 0) {
        payload?.error_messages?.forEach((msg) => errors.push(`Lote ${batchNum}: ${msg}`));
        throw new Error(payload?.error_messages?.[0] || `Erro tratado no lote ${batchNum}`);
    }
}

async function insertTableViaApi(
    table: string,
    batch: Record<string, unknown>[],
    organizationId: string | undefined,
    batchNum: number,
    errors: string[]
) {
    const rows = batch.map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value ?? null])));
    const { ok, status, payload } = await postUploadApi<{
        errors?: number;
        error_messages?: string[];
        inserted?: number;
    }>('/api/upload/table-batch', {
        table,
        rows,
        organizationId,
    });

    if (!ok) {
        const message = payload?.error || payload?.message || `Erro HTTP ${status} no lote ${batchNum}`;
        const code = typeof payload?.code === 'string' ? payload.code : undefined;

        if (status === 503 || code === 'SERVER_SUPABASE_SERVICE_ROLE_MISSING') {
            throw new NonRetryableBatchInsertError(message, code || 'UPLOAD_SERVER_UNAVAILABLE');
        }

        throw new Error(message);
    }

    const errCount = Number(payload?.errors || 0);
    if (errCount > 0) {
        payload?.error_messages?.forEach((msg) => errors.push(`Lote ${batchNum}: ${msg}`));
    }
}
