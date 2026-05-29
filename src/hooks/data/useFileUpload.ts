import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { deleteAllRecords, BatchInsertOptions, isNonRetryableBatchInsertError } from '@/utils/dbHelpers';
import { ExcelProcessConfig } from '@/utils/excelProcessor';
import { processUploadFile } from '@/utils/fileProcessing/fileProcessor';
import { triggerConcurrentRefresh } from '@/utils/fileProcessing/viewRefresher';

export interface FileUploadOptions {
  tableName: string; excelConfig: ExcelProcessConfig; overwrite?: boolean;
  deleteRpcFunction?: string; insertOptions?: BatchInsertOptions;
  refreshRpcFunction?: string; organizationId?: string;
}

export interface UploadState {
  uploading: boolean; progress: number; progressLabel: string;
  message: string; currentFileIndex: number;
}

export interface UploadResult {
  success: boolean;
  inserted: number;
  successCount: number;
  errorCount: number;
  message: string;
}

export function useFileUpload(options: FileUploadOptions) {
  const {
    tableName, excelConfig, overwrite = false, deleteRpcFunction,
    insertOptions = {}, refreshRpcFunction, organizationId
  } = options;

  const [state, setState] = useState<UploadState>({
    uploading: false, progress: 0, progressLabel: '', message: '', currentFileIndex: 0
  });

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadResult> => {
    const emptyResult = (message: string): UploadResult => ({
      success: false,
      inserted: 0,
      successCount: 0,
      errorCount: 0,
      message
    });

    if (!files.length) {
      const message = 'Selecione um arquivo.';
      setState(p => ({ ...p, message }));
      return emptyResult(message);
    }

    if (!isValidOrganizationId(organizationId)) {
      const message = 'Selecione uma organização antes de iniciar o upload.';
      setState(p => ({ ...p, message }));
      return emptyResult(message);
    }

    const rateLimit = uploadRateLimiter();
    if (!rateLimit.allowed) {
      const wait = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      const message = `⚠️ Aguarde ${wait}min`;
      setState(p => ({ ...p, message }));
      return emptyResult(message);
    }

    setState({ uploading: true, progress: 0, progressLabel: 'Iniciando...', message: '', currentFileIndex: 0 });

    let successCount = 0, errorCount = 0, totalInserted = 0, lastError = '';
    const totalFiles = files.length;

    try {
      if (overwrite) {
        setState(p => ({ ...p, progressLabel: 'Limpando dados...', progress: 5 }));
        await deleteAllRecords(tableName, deleteRpcFunction, {
          organizationId,
          requireOrganization: true
        });
        setState(p => ({ ...p, progress: 10 }));
      }

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        setState(p => ({ ...p, currentFileIndex: i + 1, progressLabel: `Arquivo ${i + 1}/${totalFiles}: ${file.name}` }));

        try {
          const inserted = await processUploadFile(file, {
            excelConfig, tableName, overwrite, organizationId, insertOptions,
            onProgress: (cur, tot, phase) => {
              const base = (overwrite ? 10 : 0) + (i / totalFiles) * (overwrite ? 80 : 90);
              const step = (cur / tot) * ((overwrite ? 80 : 90) / totalFiles);
              setState(p => ({
                ...p,
                progress: base + step,
                progressLabel: `Arquivo ${i + 1}/${totalFiles}: ${phase === 'processing' ? 'Lendo' : 'Inserindo'} ${cur}/${tot}`
              }));
            }
          });
          totalInserted += inserted;
          successCount++;
        } catch (err: unknown) {
          errorCount++;
          lastError = err instanceof Error ? err.message : String(err);
          setState(p => ({ ...p, message: `Erro em ${file.name}: ${lastError}` }));
          safeLog.error(`Erro arquivo ${file.name}`, err);

          if (isNonRetryableBatchInsertError(err)) {
            errorCount += totalFiles - i - 1;
            break;
          }
        }
      }

      setState(p => ({ ...p, progress: 100, progressLabel: 'Concluído!' }));

      const msg = errorCount === 0
        ? `✅ Sucesso! ${totalInserted} registros de ${successCount} arquivos.`
        : `⚠️ ${successCount} ok, ${errorCount} erro. Total: ${totalInserted}. Erro: ${lastError}`;

      setState(p => ({ ...p, message: msg }));

      if (errorCount === 0 && successCount > 0 && refreshRpcFunction) triggerConcurrentRefresh(refreshRpcFunction);

      return {
        success: errorCount === 0 && successCount > 0,
        inserted: totalInserted,
        successCount,
        errorCount,
        message: msg
      };

    } catch (err: unknown) {
      safeLog.error('Erro geral upload', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setState(p => ({ ...p, message: `Erro: ${msg}` }));
      return {
        success: false,
        inserted: totalInserted,
        successCount,
        errorCount: errorCount || 1,
        message: msg
      };
    } finally {
      setState(p => ({ ...p, uploading: false }));
    }
  }, [tableName, excelConfig, overwrite, deleteRpcFunction, insertOptions, refreshRpcFunction, organizationId]);

  return { ...state, uploadFiles, resetState: () => setState({ uploading: false, progress: 0, progressLabel: '', message: '', currentFileIndex: 0 }) };
}

function isValidOrganizationId(value?: string): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
