/**
 * Hook para gerenciar upload de arquivos de corridas
 */

import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { validateFile } from '@/utils/fileValidation';
import { processCorridasFile } from '@/utils/processors/corridasProcessor';
import { insertInBatches } from '@/utils/dbHelpers';
import { BATCH_SIZE, MAX_FILES } from '@/constants/upload';
import { useUploadRefresh } from './useUploadRefresh';

interface UploadState {
  uploading: boolean;
  message: string;
  progress: number;
  progressLabel: string;
  currentFileIndex: number;
}

/**
 * Hook para gerenciar upload de arquivos de corridas
 */
interface UseCorridasUploadProps {
  organizationId?: string;
}

export function useCorridasUpload({ organizationId }: UseCorridasUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>({
    uploading: false,
    message: '',
    progress: 0,
    progressLabel: '',
    currentFileIndex: 0,
  });

  const { startAutoRefresh } = useUploadRefresh();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    // Validar quantidade total
    if (files.length + selectedFiles.length > MAX_FILES) {
      setState(prev => ({
        ...prev,
        message: `⚠️ Máximo de ${MAX_FILES} arquivos permitidos. Você tentou adicionar ${selectedFiles.length} arquivo(s), mas já tem ${files.length}.`,
      }));
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(selectedFiles)) {
      const validation = await validateFile(file, files.length);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error || `Arquivo "${file.name}" inválido.`);
      }
    }

    if (errors.length > 0) {
      setState(prev => ({
        ...prev,
        message: `⚠️ ${errors.length} arquivo(s) rejeitado(s):\n${errors.join('\n')}`,
      }));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setState(prev => ({
        ...prev,
        message: '',
        progress: 0,
        progressLabel: '',
      }));
    }
  }, [files.length]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setState(prev => ({
        ...prev,
        message: 'Por favor, selecione pelo menos um arquivo.',
      }));
      return;
    }

    // Verificar rate limiting
    const rateLimit = uploadRateLimiter();
    if (!rateLimit.allowed) {
      const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
      setState(prev => ({
        ...prev,
        message: `⚠️ Muitos uploads recentes. Aguarde ${waitTime} minuto(s) antes de tentar novamente.`,
      }));
      return;
    }

    setState({
      uploading: true,
      message: '',
      progress: 0,
      progressLabel: '',
      currentFileIndex: 0,
    });

    const totalFiles = files.length;
    let successCount = 0;
    let errorCount = 0;

    for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
      const file = files[fileIdx];
      setState(prev => ({
        ...prev,
        currentFileIndex: fileIdx + 1,
        progressLabel: `Processando arquivo ${fileIdx + 1}/${totalFiles}: ${file.name}`,
      }));

      try {
        setState(prev => ({
          ...prev,
          progressLabel: 'Processando dados...',
          progress: 10,
        }));

        const sanitizedData = await processCorridasFile(file);

        const fileProgress = (fileIdx / totalFiles) * 100;
        setState(prev => ({
          ...prev,
          progress: fileProgress,
        }));

        // Usar função insertInBatches que detecta automaticamente se precisa usar RPC
        const { inserted, errors: insertErrors } = await insertInBatches(
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
                progressLabel: `Arquivo ${fileIdx + 1}/${totalFiles}: ${insertedRows}/${total} linhas`,
              }));
            },
          }
        );

        if (insertErrors.length > 0) {
          throw new Error(`Erros durante inserção: ${insertErrors.join('; ')}`);
        }

        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        safeLog.error(`Erro no arquivo ${file.name}:`, error);
        errorCount++;
      }
    }

    setState(prev => ({
      ...prev,
      progress: 100,
      progressLabel: 'Concluído!',
      message:
        errorCount === 0
          ? `✅ Todos os ${successCount} arquivo(s) foram importados com sucesso! 
        
⏳ Atualizando dados agregados... Isso pode levar 2-4 minutos para as visualizações principais.

💡 Dica: As visualizações secundárias serão atualizadas em background. Você pode fechar esta página e voltar mais tarde.`
          : `⚠️ ${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro. Verifique os logs.`,
    }));

    // Iniciar refresh automático se não houve erros
    if (errorCount === 0) {
      startAutoRefresh();
    }

    setFiles([]);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setState(prev => ({ ...prev, uploading: false }));
  }, [files, startAutoRefresh]);

  return {
    files,
    ...state,
    handleFileChange,
    removeFile,
    handleUpload,
  };
}

