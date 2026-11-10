import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { processCorridasFile } from '@/utils/processors/corridasProcessor';
import { insertInBatches, isNonRetryableBatchInsertError } from '@/utils/dbHelpers';
import { CORRIDAS_BATCH_SIZE } from '@/constants/upload';
import { clearCorridasImportId, getCorridasImportId } from '@/utils/upload/corridasImportId';

export interface UploadState {
    uploading: boolean;
    message: string;
    progress: number;
    progressLabel: string;
    currentFileIndex: number;
}

export function useUploadProcessor(organizationId?: string) {
    const [state, setState] = useState<UploadState>({
        uploading: false,
        message: '',
        progress: 0,
        progressLabel: '',
        currentFileIndex: 0
    });

    const processUpload = useCallback(async (files: File[], onSuccess: () => void | Promise<void>, onPartial?: () => void | Promise<void>): Promise<boolean> => {
        if (files.length === 0) {
            setState(prev => ({ ...prev, message: 'Por favor, selecione pelo menos um arquivo.' }));
            return false;
        }

        if (!isValidOrganizationId(organizationId)) {
            setState(prev => ({ ...prev, message: 'Selecione uma organizacao antes de iniciar o upload.' }));
            return false;
        }

        const rateLimit = uploadRateLimiter();
        if (!rateLimit.allowed) {
            const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
            setState(prev => ({ ...prev, message: `Muitos uploads recentes. Aguarde ${waitTime} minuto(s).` }));
            return false;
        }

        setState({ uploading: true, message: '', progress: 0, progressLabel: '', currentFileIndex: 0 });

        const totalFiles = files.length;
        let successCount = 0;
        let errorCount = 0;
        let attemptedInsert = false;
        let confirmedRows = 0;
        const importIds: Array<{ file: File; importId: string }> = [];
        const finalErrorMessageParts: string[] = [];

        for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
            const file = files[fileIdx];
            let fileInsertionStarted = false;
            let fileConfirmedRows = 0;
            setState(prev => ({
                ...prev,
                currentFileIndex: fileIdx + 1,
                progressLabel: `Processando arquivo ${fileIdx + 1}/${totalFiles}: ${file.name}`
            }));

            try {
                setState(prev => ({ ...prev, progressLabel: 'Processando dados...', progress: 10 }));

                const { rows: sanitizedData, fileHash } = await processCorridasFile(file);

                const importId = getCorridasImportId(file, organizationId!, fileHash);
                importIds.push({ file, importId });

                const fileProgress = (fileIdx / totalFiles) * 100;
                setState(prev => ({ ...prev, progress: fileProgress }));

                attemptedInsert ||= sanitizedData.length > 0;
                fileInsertionStarted = sanitizedData.length > 0;
                const { errors: insertErrors } = await insertInBatches(
                    'dados_corridas',
                    sanitizedData,
                    {
                        batchSize: CORRIDAS_BATCH_SIZE,
                        organizationId,
                        importId,
                        onProgress: (insertedRows, total) => {
                            confirmedRows += Math.max(0, insertedRows - fileConfirmedRows);
                            fileConfirmedRows = insertedRows;
                            const batchProgress = (insertedRows / total) * (100 / totalFiles);
                            setState(prev => ({
                                ...prev,
                                progress: fileProgress + batchProgress,
                                progressLabel: `Arquivo ${fileIdx + 1}/${totalFiles}: ${insertedRows}/${total} linhas`
                            }));
                        }
                    }
                );

                if (insertErrors.length > 0) throw new Error(`Erros durante insercao: ${insertErrors.join('; ')}`);
                successCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                safeLog.error(`Erro no arquivo ${file.name}:`, error);
                finalErrorMessageParts.push(`${file.name}: ${errorMessage}`);
                errorCount++;

                if (isNonRetryableBatchInsertError(error) || fileInsertionStarted) {
                    const remainingFiles = totalFiles - fileIdx - 1;
                    if (remainingFiles > 0) {
                        finalErrorMessageParts.push(`Upload interrompido: ${remainingFiles} arquivo(s) restante(s) nao foram enviados; confira os dados gravados antes de continuar.`);
                        errorCount += remainingFiles;
                    }
                    break;
                }
            }
        }

        const detailedErrorMsg = finalErrorMessageParts.length > 0
            ? `\n\nDetalhes do erro:\n${finalErrorMessageParts.join('\n')}`
            : '';

        setState(prev => ({
            ...prev,
            progress: errorCount === 0 ? 100 : prev.progress,
            progressLabel: errorCount === 0 ? 'Concluido!' : 'Importacao interrompida',
            message: errorCount === 0
                ? `Todos os ${successCount} arquivo(s) foram importados com sucesso!\n\nAtualizando dados agregados...`
                : `${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro ou não enviado(s). ${confirmedRows} linha(s) tiveram gravação confirmada. Para retomar, use os mesmos arquivos neste navegador.${detailedErrorMsg}`,
            uploading: false
        }));

        if (errorCount === 0) {
            safeLog.info('[Upload] Upload concluido com sucesso, chamando onSuccess (auto-refresh MVs)...');
            await onSuccess();
            try {
                for (const entry of importIds) clearCorridasImportId(entry.file, organizationId!, entry.importId);
            } catch {
                setState(prev => ({ ...prev, message: `${prev.message}\n\nNão foi possível finalizar o registro local da importação. Verifique o armazenamento do navegador antes de importar esse arquivo novamente.` }));
            }
            return true;
        }

        if (attemptedInsert && onPartial) {
            await onPartial();
        }
        safeLog.warn(`[Upload] Upload interrompido com ${errorCount} erro(s); a retomada deve usar os mesmos arquivos.`);
        return false;
    }, [organizationId]);

    return { state, setState, processUpload };
}

function isValidOrganizationId(value?: string): value is string {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
