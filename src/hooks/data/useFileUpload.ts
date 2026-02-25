import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { deleteAllRecords, BatchInsertOptions } from '@/utils/dbHelpers';
import { ExcelProcessConfig } from '@/utils/excelProcessor';
import { processUploadFile } from '@/utils/fileProcessing/fileProcessor';
import { triggerConcurrentRefresh } from '@/utils/fileProcessing/viewRefresher';

export interface FileUploadOptions {
  tableName: string;
  excelConfig: ExcelProcessConfig;
  overwrite?: boolean;
  deleteRpcFunction?: string;
  insertOptions?: BatchInsertOptions;
  refreshRpcFunction?: string;
  organizationId?: string;
}

export interface UploadState {
  uploading: boolean;
  progress: number;
  progressLabel: string;
  message: string;
  currentFileIndex: number;
}

export function useFileUpload(options: FileUploadOptions) {
  const {
    tableName, excelConfig, overwrite = false, deleteRpcFunction,
    insertOptions = {}, refreshRpcFunction, organizationId
  } = options;

  const [state, setState] = useState<UploadState>({
    uploading: false, progress: 0, progressLabel: '', message: '', currentFileIndex: 0
  });

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return setState(p => ({ ...p, message: 'Selecione um arquivo.' }));

    const rateLimit = uploadRateLimiter();
    if (!rateLimit.allowed) {
      const wait = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      return setState(p => ({ ...p, message: `⚠️ Aguarde ${wait}min` }));
    }

    setState({ uploading: true, progress: 0, progressLabel: 'Iniciando...', message: '', currentFileIndex: 0 });

    let successCount = 0, errorCount = 0, totalInserted = 0, lastError = '';
    const totalFiles = files.length;

    try {
      if (overwrite) {
        setState(p => ({ ...p, progressLabel: 'Limpando dados...', progress: 5 }));
        await deleteAllRecords(tableName, deleteRpcFunction);
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
        }
      }

      setState(p => ({ ...p, progress: 100, progressLabel: 'Concluído!' }));

      const msg = errorCount === 0
        ? `✅ Sucesso! ${totalInserted} registros de ${successCount} arquivos.`
        : `⚠️ ${successCount} ok, ${errorCount} erro. Total: ${totalInserted}. Erro: ${lastError}`;

      setState(p => ({ ...p, message: msg }));

      if (refreshRpcFunction) triggerConcurrentRefresh(refreshRpcFunction);

    } catch (err: unknown) {
      safeLog.error('Erro geral upload', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setState(p => ({ ...p, message: `Erro: ${msg}` }));
    } finally {
      setState(p => ({ ...p, uploading: false }));
    }
  }, [tableName, excelConfig, overwrite, deleteRpcFunction, insertOptions, refreshRpcFunction, organizationId]);

  return { ...state, uploadFiles, resetState: () => setState({ uploading: false, progress: 0, progressLabel: '', message: '', currentFileIndex: 0 }) };
}
