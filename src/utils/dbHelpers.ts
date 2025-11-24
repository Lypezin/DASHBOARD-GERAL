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
  /** ID da organização para forçar nos dados (opcional) */
  organizationId?: string;
}

/**
 * Insere dados em lotes no banco de dados
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
  safeLog.info(`Total de registros: ${totalRows}, Tamanho do lote: ${batchSize}`);

  // Verificar se precisa usar função RPC para bypassar RLS
  const useRpcFunction = table === 'dados_marketing' || table === 'dados_corridas';
  const rpcFunctionName = useRpcFunction
    ? (table === 'dados_marketing' ? 'insert_dados_marketing_batch' : 'insert_dados_corridas_batch')
    : null;

  for (let i = 0; i < totalRows; i += batchSize) {
    let batch = data.slice(i, i + batchSize);

    // Injetar organization_id se fornecido
    if (organizationId) {
      batch = batch.map(item => ({
        ...item,
        organization_id: organizationId
      }));
    }

    const batchNumber = Math.floor(i / batchSize) + 1;

    safeLog.info(`Inserindo lote ${batchNumber}, ${batch.length} registros${useRpcFunction ? ' (via RPC)' : ''}`);

    try {
      if (useRpcFunction && rpcFunctionName) {
        // Usar função RPC para bypassar RLS
        // PostgREST aceita arrays JSONB diretamente quando passados como parâmetro
        // Precisamos garantir que os dados estão no formato correto
        const dadosJsonb = batch.map(item => {
          // Garantir que todos os valores estão no formato correto
          // Converter para objeto simples para garantir compatibilidade
          const itemObj = item as Record<string, unknown>;
          const cleanItem: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(itemObj)) {
            // Converter undefined/null para null explícito
            // Manter tipos originais (number, string, etc)
            if (value === undefined || value === null) {
              cleanItem[key] = null;
            } else {
              cleanItem[key] = value;
            }
          }
          return cleanItem;
        });

        safeLog.info(`Chamando RPC ${rpcFunctionName} com ${dadosJsonb.length} registros`);

        // PostgREST aceita arrays JSONB quando passados diretamente
        // O Supabase client converte automaticamente para o formato correto
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc(rpcFunctionName, {
            dados: dadosJsonb
          } as { dados: unknown[] });

        if (rpcError) {
          const errorMsg = `Erro no lote ${batchNumber}: ${rpcError.message}${rpcError.details ? ` (${rpcError.details})` : ''}${rpcError.code ? ` [${rpcError.code}]` : ''}`;
          safeLog.error('Erro ao inserir lote via RPC:', {
            error: rpcError,
            function: rpcFunctionName,
            batchSize: dadosJsonb.length,
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint
          });

          // Se for erro 403 ou função não encontrada, tentar inserção direta como fallback
          const is403 = rpcError.code === 'PGRST301' ||
            rpcError.message?.includes('403') ||
            rpcError.message?.includes('Forbidden') ||
            rpcError.code === 'PGRST116'; // Função não encontrada

          if (is403) {
            safeLog.warn('Erro 403 ou função não encontrada - Tentando inserção direta como fallback (pode falhar por RLS)');

            // Tentar inserção direta (pode falhar se RLS bloquear)
            try {
              const { error: directError } = await supabase
                .from(table)
                .insert(batch, { count: 'exact' });

              if (directError) {
                // Se inserção direta também falhar, lançar erro original
                errors.push(errorMsg);
                throw new Error(errorMsg);
              } else {
                // Inserção direta funcionou (RLS pode ter sido contornado de outra forma)
                safeLog.info('Inserção direta funcionou como fallback');
                insertedRows += batch.length;
                // Continuar para próximo lote
                if (onProgress) {
                  onProgress(insertedRows, totalRows);
                }
                continue; // Pular para próximo lote
              }
            } catch (fallbackError) {
              // Fallback também falhou
              errors.push(errorMsg);
              throw new Error(errorMsg);
            }
          } else {
            errors.push(errorMsg);
            throw new Error(errorMsg);
          }
        }

        const result = rpcResult as { inserted?: number; errors?: number; error_messages?: string[] } | null;
        const inserted = result?.inserted || 0;
        const rpcErrors = result?.errors || 0;

        if (rpcErrors > 0) {
          const errorMessages = result?.error_messages || [];
          errorMessages.forEach((msg: string) => errors.push(`Lote ${batchNumber}: ${msg}`));
        }

        insertedRows += inserted;
      } else {
        // Inserção direta (para tabelas sem RLS restritivo)
        const insertOptions: { count: 'exact'; select?: string } = { count: 'exact' };
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
    } catch (error) {
      const errorMsg = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : `Erro desconhecido no lote ${batchNumber}`;
      errors.push(errorMsg);
      safeLog.error(`Erro no lote ${batchNumber}:`, error);

      // Se for erro crítico, parar processamento
      const errorCode = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? error.code
        : undefined;
      if (errorCode === '23505' || errorCode === '23503') {
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
    } catch (rpcErr) {
      const error = rpcErr as { code?: string; message?: string };
      if (error.code !== 'PGRST116') {
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

