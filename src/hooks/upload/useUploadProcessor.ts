import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { processCorridasFile } from '@/utils/processors/corridasProcessor';
import { insertInBatches } from '@/utils/dbHelpers';
import { BATCH_SIZE } from '@/constants/upload';

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
        currentFileIndex: 0,
    });

    const processUpload = useCallback(async (files: File[], onSuccess: () => void) => {
        if (files.length === 0) {
            setState(prev => ({ ...prev, message: 'Por favor, selecione pelo menos um arquivo.' }));
            return;
        }

        const rateLimit = uploadRateLimiter();
        if (!rateLimit.allowed) {
            const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
            setState(prev => ({ ...prev, message: `⚠️ Muitos uploads recentes. Aguarde ${waitTime} minuto(s).` }));
            return;
        }

        setState({ uploading: true, message: '', progress: 0, progressLabel: '', currentFileIndex: 0 });

        const totalFiles = files.length;
        let successCount = 0;
        let errorCount = 0;
        const finalErrorMessageParts: string[] = [];

        for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
            const file = files[fileIdx];
            setState(prev => ({
                ...prev,
                currentFileIndex: fileIdx + 1,
                progressLabel: `Processando arquivo ${fileIdx + 1}/${totalFiles}: ${file.name}`
            }));

            try {
                setState(prev => ({ ...prev, progressLabel: 'Processando dados...', progress: 10 }));

                const sanitizedData = await processCorridasFile(file);

                const fileProgress = (fileIdx / totalFiles) * 100;
                setState(prev => ({ ...prev, progress: fileProgress }));

                const { errors: insertErrors } = await insertInBatches(
                    'dados_corridas',
                    sanitizedData,
                    {
                        batchSize: BATCH_SIZE,
                        organizationId,
                        onProgress: (insertedRows, total) => {
                            const batchProgress = (insertedRows / total) * (100 / totalFiles);
                            setState(prev => ({
                                ...prev,
                                progress: fileProgress + batchProgress,
                                progressLabel: `Arquivo ${fileIdx + 1}/${totalFiles}: ${insertedRows}/${total} linhas`
                            }));
                        }
                    }
                );

                if (insertErrors.length > 0) throw new Error(`Erros durante inserção: ${insertErrors.join('; ')}`);
                successCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                safeLog.error(`Erro no arquivo ${file.name}:`, error);
                finalErrorMessageParts.push(`${file.name}: ${errorMessage}`);
                errorCount++;
            }
        }

        const detailedErrorMsg = finalErrorMessageParts.length > 0 ? `\n\nDetalhes do erro:\n${finalErrorMessageParts.join('\n')}` : '';

        setState(prev => ({
            ...prev,
            progress: 100,
            progressLabel: 'Concluído!',
            message: errorCount === 0
                ? `✅ Todos os ${successCount} arquivo(s) foram importados com sucesso!\n\n⏳ Atualizando dados agregados...`
                : `⚠️ ${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro.${detailedErrorMsg}`,
            uploading: false
        }));

        if (errorCount === 0) {
            safeLog.info('[Upload] Upload concluído com sucesso, chamando onSuccess (auto-refresh MVs)...');
            onSuccess();
        } else {
            safeLog.warn(`[Upload] Upload concluído com ${errorCount} erro(s), auto-refresh NÃO será disparado`);
        }

    }, [organizationId]);

    return { state, setState, processUpload };
}
