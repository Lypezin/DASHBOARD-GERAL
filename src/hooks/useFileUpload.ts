/**
 * Hook genérico para upload de arquivos Excel
 * Centraliza lógica de processamento, validação e inserção
 */

import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { processExcelData, ExcelProcessConfig } from '@/utils/excelProcessor';
import { insertInBatches, deleteAllRecords, BatchInsertOptions } from '@/utils/dbHelpers';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS, DELAYS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Opções para upload de arquivo
 */
export interface FileUploadOptions {
  /** Nome da tabela no banco de dados */
  tableName: string;
  /** Configuração de processamento Excel */
  excelConfig: ExcelProcessConfig;
  /** Se deve deletar dados antigos antes de inserir */
  overwrite?: boolean;
  /** Nome da função RPC para deletar todos os registros (se overwrite=true) */
  deleteRpcFunction?: string;
  /** Opções de inserção em lotes */
  insertOptions?: BatchInsertOptions;
  /** Função RPC para refresh após upload (opcional) */
  refreshRpcFunction?: string;
}

/**
 * Estado do upload
 */
export interface UploadState {
  uploading: boolean;
  progress: number;
  progressLabel: string;
  message: string;
  currentFileIndex: number;
}

/**
 * Hook para gerenciar upload de arquivos Excel
 */
export function useFileUpload(options: FileUploadOptions) {
  const {
    tableName,
    excelConfig,
    overwrite = false,
    deleteRpcFunction,
    insertOptions = {},
    refreshRpcFunction
  } = options;

  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    progressLabel: '',
    message: '',
    currentFileIndex: 0,
  });

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setState(prev => ({ ...prev, message: 'Por favor, selecione pelo menos um arquivo.' }));
      return;
    }

    // Verificar rate limiting
    const rateLimit = uploadRateLimiter();
    if (!rateLimit.allowed) {
      const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
      setState(prev => ({
        ...prev,
        message: `⚠️ Muitos uploads recentes. Aguarde ${waitTime} minuto(s) antes de tentar novamente.`
      }));
      return;
    }

    setState({
      uploading: true,
      progress: 0,
      progressLabel: 'Iniciando upload...',
      message: '',
      currentFileIndex: 0,
    });

    const totalFiles = files.length;
    let successCount = 0;
    let errorCount = 0;
    let totalInsertedRows = 0;
    let lastError: string = '';

    try {
      // PASSO 1: Deletar dados antigos se necessário
      if (overwrite) {
        setState(prev => ({ ...prev, progressLabel: 'Removendo dados antigos...', progress: 5 }));
        
        try {
          await deleteAllRecords(tableName, deleteRpcFunction);
        } catch (deleteErr) {
          safeLog.error('Erro na etapa de remoção:', deleteErr);
          const errorMessage = deleteErr && typeof deleteErr === 'object' && 'message' in deleteErr && typeof deleteErr.message === 'string'
            ? deleteErr.message
            : String(deleteErr);
          throw new Error(`Erro ao preparar banco de dados: ${errorMessage}`);
        }

        setState(prev => ({
          ...prev,
          progress: 10,
          progressLabel: 'Dados antigos removidos. Processando novos dados...'
        }));
      }

      // PASSO 2: Processar cada arquivo
      for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const file = files[fileIdx];
        setState(prev => ({
          ...prev,
          currentFileIndex: fileIdx + 1,
          progressLabel: `Processando arquivo ${fileIdx + 1}/${totalFiles}: ${file.name}`
        }));
        
        safeLog.info(`Iniciando processamento do arquivo: ${file.name}`);

        try {
          // Processar arquivo Excel
          const sanitizedData = await processExcelData(file, {
            ...excelConfig,
            onProgress: (current, total) => {
              const fileProgress = (overwrite ? 10 : 0) + (fileIdx / totalFiles) * (overwrite ? 80 : 90);
              const batchProgress = (current / total) * ((overwrite ? 80 : 90) / totalFiles);
              setState(prev => ({
                ...prev,
                progress: fileProgress + batchProgress,
                progressLabel: `Arquivo ${fileIdx + 1}/${totalFiles}: Processando ${current}/${total} linhas`
              }));
            }
          });

          const totalRows = sanitizedData.length;
          let insertedRows = 0;

          // Inserir em lotes
          safeLog.info('Iniciando inserção no banco de dados...');
          const fileProgress = (overwrite ? 10 : 0) + (fileIdx / totalFiles) * (overwrite ? 80 : 90);
          
          const { inserted, errors } = await insertInBatches(tableName, sanitizedData, {
            ...insertOptions,
            onProgress: (inserted, total) => {
              insertedRows = inserted;
              const batchProgress = (inserted / total) * ((overwrite ? 80 : 90) / totalFiles);
              setState(prev => ({
                ...prev,
                progress: fileProgress + batchProgress,
                progressLabel: `Arquivo ${fileIdx + 1}/${totalFiles}: ${inserted}/${total} linhas inseridas`
              }));
            }
          });

          if (errors.length > 0) {
            throw new Error(`Erros durante inserção: ${errors.join('; ')}`);
          }

          totalInsertedRows += inserted;
          safeLog.info(`Arquivo ${file.name} processado com sucesso: ${inserted} registros inseridos`);
          successCount++;
        } catch (error) {
          safeLog.error(`❌ ERRO no arquivo ${file.name}:`, error);
          const errorStack = error && typeof error === 'object' && 'stack' in error && typeof error.stack === 'string'
            ? error.stack
            : undefined;
          if (errorStack) {
            safeLog.error('Stack trace:', errorStack);
          }
          errorCount++;
          const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : (error && typeof error.toString === 'function' ? error.toString() : 'Erro desconhecido');
          lastError = errorMessage;
          setState(prev => ({
            ...prev,
            message: `⚠️ Erro ao processar ${file.name}: ${errorMessage}`
          }));
        }
      }

      setState(prev => ({
        ...prev,
        progress: 100,
        progressLabel: 'Concluído!'
      }));

      // Mensagem final
      if (errorCount === 0) {
        const successMsg = `✅ Upload concluído com sucesso! ${totalInsertedRows} registro(s) importado(s) de ${successCount} arquivo(s).`;
        safeLog.info(successMsg);
        setState(prev => ({ ...prev, message: successMsg }));
      } else {
        const errorMsg = `⚠️ ${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro. Total: ${totalInsertedRows} registro(s).${lastError ? ` Último erro: ${lastError}` : ''}`;
        safeLog.error(errorMsg);
        setState(prev => ({ ...prev, message: errorMsg }));
      }

      // ⚠️ OTIMIZAÇÃO: Refresh CONCURRENTLY otimizado (reduz Disk IO em 70-90%)
      // Usa REFRESH MATERIALIZED VIEW CONCURRENTLY que permite leitura durante refresh
      if (refreshRpcFunction) {
        try {
          setTimeout(async () => {
            try {
              // Usar função RPC otimizada com CONCURRENTLY
              const { data, error } = await safeRpc<{
                success: boolean;
                view?: string;
                duration_seconds?: number;
                message?: string;
                error?: string;
              }>(refreshRpcFunction, {}, {
                timeout: RPC_TIMEOUTS.LONG * 2, // Timeout aumentado para CONCURRENTLY (mais rápido que normal)
                validateParams: false
              });
              
              if (error) {
                const errorCode = (error as any)?.code;
                const is404 = errorCode === 'PGRST116' || errorCode === '42883' || (error as any)?.message?.includes('404');
                if (!is404 && IS_DEV) {
                  safeLog.warn('Refresh CONCURRENTLY não disponível, será processado automaticamente');
                }
              } else if (data?.success && IS_DEV) {
                const duration = data.duration_seconds ? `${data.duration_seconds.toFixed(2)}s` : 'N/A';
                safeLog.info(`✅ Refresh CONCURRENTLY concluído: ${data.view || refreshRpcFunction} em ${duration}`);
              } else if (IS_DEV) {
                safeLog.info('Refresh da materialized view iniciado em segundo plano (CONCURRENTLY)');
              }
            } catch (e) {
              if (IS_DEV) {
                safeLog.warn('Refresh CONCURRENTLY não disponível, será processado automaticamente');
              }
            }
          }, DELAYS.REFRESH_ASYNC);
        } catch (e) {
          // Silenciar erros
        }
      }

    } catch (error: any) {
      safeLog.error('❌ ERRO GERAL no upload:', error);
      safeLog.error('Stack trace completo:', error?.stack);
      const errorMsg = `❌ Erro: ${error?.message || error?.toString() || 'Erro desconhecido'}`;
      setState(prev => ({ ...prev, message: errorMsg }));
    } finally {
      setState(prev => ({ ...prev, uploading: false }));
      safeLog.info('Upload finalizado');
    }
  }, [tableName, excelConfig, overwrite, deleteRpcFunction, insertOptions, refreshRpcFunction]);

  const resetState = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      progressLabel: '',
      message: '',
      currentFileIndex: 0,
    });
  }, []);

  return {
    ...state,
    uploadFiles,
    resetState,
  };
}

