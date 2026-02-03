/**
 * Utilitários para inserção em lotes no banco de dados.
 */

import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { BATCH_SIZE } from '@/constants/upload';

export interface BatchInsertOptions {
    batchSize?: number;
    onProgress?: (inserted: number, total: number) => void;
    returnData?: boolean;
    organizationId?: string;
}

/**
 * Insere dados em lotes no banco de dados.
 */
export async function insertInBatches<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string,
    data: T[],
    options: BatchInsertOptions = {}
): Promise<{ inserted: number; errors: string[] }> {
    const {
        batchSize = BATCH_SIZE,
        onProgress,
        returnData = false,
        organizationId
    } = options;

    const totalRows = data.length;
    let insertedRows = 0;
    const errors: string[] = [];

    safeLog.info(`Iniciando inserção em lotes na tabela ${table}...`);

    const useRpcFunction = table === 'dados_marketing' || table === 'dados_corridas';
    const rpcFunctionName = useRpcFunction
        ? (table === 'dados_marketing' ? 'insert_dados_marketing_batch' : 'insert_dados_corridas_batch')
        : null;

    for (let i = 0; i < totalRows; i += batchSize) {
        let batch = data.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        // Injetar organization_id se necessário
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (organizationId && UUID_REGEX.test(organizationId)) {
            batch = batch.map(item => ({ ...item, organization_id: organizationId }));
        }

        try {
            if (useRpcFunction && rpcFunctionName) {
                await insertViaRpc(table, batch, rpcFunctionName, batchNumber, errors, insertedRows);
                insertedRows += batch.length; // Assumindo sucesso parcial handled in helper
            } else {
                await insertDirectly(table, batch, batchNumber, returnData, errors);
                insertedRows += batch.length;
            }

            if (onProgress) onProgress(insertedRows, totalRows);

        } catch (error) {
            handleBatchError(error, batchNumber, errors);
            // Check for critical errors
            const errorCode = error && typeof error === 'object' && 'code' in error ? (error.code as string) : undefined;
            if (errorCode === '23505' || errorCode === '23503') throw error;
        }
    }

    safeLog.info(`Inserção concluída: ${insertedRows}/${totalRows}`);
    if (errors.length > 0) safeLog.warn(`Erros encontrados: ${errors.length}`);

    return { inserted: insertedRows, errors };
}

interface RpcBatchResult {
    inserted: number;
    errors: number;
    error_messages: string[];
}

async function insertViaRpc<T extends Record<string, unknown>>(
    table: string,
    batch: T[],
    rpcName: string,
    batchNum: number,
    errors: string[],
    currentInserted: number
) {
    // Preparar dados para JSONB
    const dadosJsonb = batch.map(item => {
        const clean: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(item)) {
            clean[key] = (value === undefined || value === null) ? null : value;
        }
        return clean;
    });

    const { data: rpcResult, error: rpcError } = await supabase.rpc(rpcName, { dados: dadosJsonb });

    if (rpcError) {
        // Tentar fallback se for 403 ou funcao nao encontrada
        if (rpcError.code === 'PGRST301' || rpcError.message?.includes('403') || rpcError.code === 'PGRST116') {
            safeLog.warn(`Fallback para inserção direta no lote ${batchNum}`);
            const { error: directErr } = await supabase.from(table).insert(batch as any, { count: 'exact' });
            if (directErr) throw new Error(`Erro insert fallback: ${directErr.message}`);
            return; // Sucesso fallback
        }
        throw new Error(`Erro RPC ${rpcName}: ${rpcError.message}`);
    }

    // Processar resultado RPC
    const result = rpcResult as unknown as RpcBatchResult;
    if (result && result.errors > 0) {
        (result.error_messages || []).forEach(msg => errors.push(`Lote ${batchNum}: ${msg}`));
    }
}

async function insertDirectly<T extends Record<string, unknown>>(
    table: string,
    batch: T[],
    batchNum: number,
    returnData: boolean,
    errors: string[]
) {
    const opts: { count: 'exact' | 'estimated' | 'planned'; select?: string } = { count: 'exact' };

    // NOTA: supabase.from().insert() typings podem reclamar se passarmos T[] direto sem 'any'
    // porque T não é garantia de corresponder à tabela. Usando 'as any' SÓ no batch para o supabase
    // mas mantendo tipagem segura no resto da função.
    const query = supabase.from(table).insert(batch as any, opts);

    if (returnData) {
        query.select();
    }

    const { error } = await query;
    if (error) throw new Error(`Erro insert direto: ${error.message}`);
}

function handleBatchError(error: unknown, batchNum: number, errors: string[]) {
    // Basic Error Handling
    const err = error as { message?: string } | null;
    const msg = err?.message || `Erro desconhecido lote ${batchNum}`;
    errors.push(msg);
    safeLog.error(`Erro no lote ${batchNum}:`, error);
}
