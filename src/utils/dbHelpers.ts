/**
 * Funções utilitárias para operações no banco de dados
 * Centraliza lógica de inserção em lotes e outras operações comuns
 */

import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { BATCH_SIZE } from '@/constants/upload';

/**
 * Opções para inserção em lotes
 */
export interface BatchInsertOptions {
  /** Tamanho do lote (padrão: 500) */
  batchSize?: number;
  /** Callback de progresso */
  onProgress?: (inserted: number, total: number) => void;
  /** Se deve retornar dados inseridos */
  returnData?: boolean;
}

/**
 * Insere dados em lotes no banco de dados
 */
export async function insertInBatches<T = any>(
  table: string,
  data: T[],
  options: BatchInsertOptions = {}
): Promise<{ inserted: number; errors: string[] }> {
  const {
    batchSize = BATCH_SIZE,
    onProgress,
    returnData = false
  } = options;

  const totalRows = data.length;
  let insertedRows = 0;
  const errors: string[] = [];

  safeLog.info(`Iniciando inserção em lotes na tabela ${table}...`);
  safeLog.info(`Total de registros: ${totalRows}, Tamanho do lote: ${batchSize}`);

  // Verificar se precisa usar função RPC para bypassar RLS
  const useRpcFunction = table === 'dados_marketing' || table === 'dados_corridas';
  const rpcFunctionName = useRpcFunction 
    ? (table === 'dados_marketing' ? 'insert_dados_marketing_batch' : 'insert_dados_corridas_batch')
    : null;

  for (let i = 0; i < totalRows; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    safeLog.info(`Inserindo lote ${batchNumber}, ${batch.length} registros${useRpcFunction ? ' (via RPC)' : ''}`);
    
    try {
      if (useRpcFunction && rpcFunctionName) {
        // Usar função RPC para bypassar RLS
        // Converter array de objetos para array JSONB
        const dadosJsonb = batch.map(item => JSON.parse(JSON.stringify(item)));
        
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc(rpcFunctionName, { dados: dadosJsonb });

        if (rpcError) {
          const errorMsg = `Erro no lote ${batchNumber}: ${rpcError.message}${rpcError.details ? ` (${rpcError.details})` : ''}`;
          safeLog.error('Erro ao inserir lote via RPC:', rpcError);
          errors.push(errorMsg);
          throw new Error(errorMsg);
        }

        const inserted = (rpcResult as any)?.inserted || 0;
        const rpcErrors = (rpcResult as any)?.errors || 0;
        
        if (rpcErrors > 0) {
          const errorMessages = (rpcResult as any)?.error_messages || [];
          errorMessages.forEach((msg: string) => errors.push(`Lote ${batchNumber}: ${msg}`));
        }

        insertedRows += inserted;
      } else {
        // Inserção direta (para tabelas sem RLS restritivo)
        const insertOptions: any = { count: 'exact' };
        if (returnData) {
          insertOptions.select = '*';
        }

        const { data: insertData, error: batchError } = await supabase
          .from(table)
          .insert(batch, insertOptions)
          .select(returnData ? '*' : undefined);

        if (batchError) {
          const errorMsg = `Erro no lote ${batchNumber}: ${batchError.message}${batchError.details ? ` (${batchError.details})` : ''}`;
          safeLog.error('Erro ao inserir lote:', batchError);
          safeLog.error('Detalhes do erro:', {
            code: batchError.code,
            message: batchError.message,
            details: batchError.details,
            hint: batchError.hint
          });
          errors.push(errorMsg);
          throw new Error(errorMsg);
        }

        insertedRows += batch.length;
      }
      
      if (onProgress) {
        onProgress(insertedRows, totalRows);
      }
      
      safeLog.info(`Lote inserido com sucesso: ${insertedRows}/${totalRows}`);
    } catch (error: any) {
      const errorMsg = error?.message || `Erro desconhecido no lote ${batchNumber}`;
      errors.push(errorMsg);
      safeLog.error(`Erro no lote ${batchNumber}:`, error);
      
      // Se for erro crítico, parar processamento
      if (error?.code === '23505' || error?.code === '23503') {
        throw error; // Erros de constraint devem parar o processo
      }
      
      // Para outros erros, continuar com próximo lote
    }
  }

  safeLog.info(`Inserção concluída: ${insertedRows}/${totalRows} registros inseridos`);
  if (errors.length > 0) {
    safeLog.warn(`Erros encontrados: ${errors.length}`);
  }

  return {
    inserted: insertedRows,
    errors
  };
}

/**
 * Deleta todos os registros de uma tabela usando função RPC ou fallback
 */
export async function deleteAllRecords(
  table: string,
  rpcFunctionName?: string
): Promise<number> {
  safeLog.info(`Iniciando remoção de dados antigos da tabela ${table}...`);
  
  // Tentar usar função RPC se fornecida
  if (rpcFunctionName) {
    try {
      const { data: deletedCount, error: rpcError } = await supabase
        .rpc(rpcFunctionName);
      
      if (!rpcError) {
        safeLog.info(`✅ Removidos ${deletedCount || 0} registros antigos via RPC`);
        return deletedCount || 0;
      }
      
      // Se função não existe, usar fallback
      if (rpcError.code === 'PGRST116' || rpcError.message?.includes('function') || rpcError.message?.includes('not found')) {
        safeLog.info('Função RPC não encontrada, usando fallback de deleção em lotes...');
      } else {
        throw new Error(`Erro ao deletar via RPC: ${rpcError.message}${rpcError.details ? ` (${rpcError.details})` : ''}`);
      }
    } catch (rpcErr: any) {
      if (rpcErr.code !== 'PGRST116') {
        throw rpcErr;
      }
      safeLog.info('Função RPC não disponível, usando fallback...');
    }
  }
  
  // Fallback: deletar em lotes
  let deletedCount = 0;
  let hasMore = true;
  const deleteBatchSize = 500;
  
  while (hasMore) {
    const { data: batchData, error: fetchError } = await supabase
      .from(table)
      .select('id')
      .limit(deleteBatchSize);
    
    if (fetchError) {
      throw new Error(`Erro ao buscar dados: ${fetchError.message}`);
    }
    
    if (!batchData || batchData.length === 0) {
      hasMore = false;
      break;
    }
    
    const idsToDelete = batchData.map(item => item.id);
    
    if (idsToDelete.length === 0) {
      hasMore = false;
      break;
    }
    
    safeLog.info(`Deletando lote de ${idsToDelete.length} registros...`);
    
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      throw new Error(`Erro ao remover dados: ${deleteError.message}`);
    }
    
    deletedCount += idsToDelete.length;
    safeLog.info(`Lote deletado. Total: ${deletedCount}`);
    
    if (batchData.length < deleteBatchSize) {
      hasMore = false;
    }
  }
  
  safeLog.info(`✅ Removidos ${deletedCount} registros antigos (fallback)`);
  return deletedCount;
}

