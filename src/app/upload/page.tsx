'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UploadSection } from '@/components/upload/UploadSection';
import { useUploadAuth } from '@/hooks/useUploadAuth';
import { validateFile } from '@/utils/fileValidation';
import { processCorridasFile } from '@/utils/processors/corridasProcessor';
import {
  COLUMN_MAP,
  MARKETING_COLUMN_MAP,
  VALORES_CIDADE_COLUMN_MAP,
  BATCH_SIZE,
  MAX_FILES,
} from '@/constants/upload';
import { useFileUpload } from '@/hooks/useFileUpload';
import { marketingTransformers, valoresCidadeTransformers } from '@/utils/uploadTransformers';
import { insertInBatches } from '@/utils/dbHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export default function UploadPage() {
  const { loading, isAuthorized } = useUploadAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [marketingFiles, setMarketingFiles] = useState<File[]>([]);
  const [valoresCidadeFiles, setValoresCidadeFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshProgressLabel, setRefreshProgressLabel] = useState('');
  const [refreshTotal, setRefreshTotal] = useState(0);
  const [refreshCompleted, setRefreshCompleted] = useState(0);

  // Hook genérico para upload de Marketing
  const marketingUpload = useFileUpload({
    tableName: 'dados_marketing',
    excelConfig: {
      columnMap: MARKETING_COLUMN_MAP,
      transformers: marketingTransformers,
      requiredFields: [],
      filterEmptyRows: true,
    },
    overwrite: true,
    deleteRpcFunction: 'delete_all_dados_marketing',
    refreshRpcFunction: 'refresh_mv_entregadores_marketing', // Atualiza mv_entregadores_marketing após upload
  });

  // Hook genérico para upload de Valores por Cidade
  const valoresCidadeUpload = useFileUpload({
    tableName: 'dados_valores_cidade',
    excelConfig: {
      columnMap: VALORES_CIDADE_COLUMN_MAP,
      transformers: valoresCidadeTransformers,
      requiredFields: ['data', 'id_atendente', 'cidade', 'valor'],
      filterEmptyRows: true,
    },
    overwrite: true,
    deleteRpcFunction: 'delete_all_dados_valores_cidade',
  });


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    // Validar quantidade total
    if (files.length + selectedFiles.length > MAX_FILES) {
      setMessage(`⚠️ Máximo de ${MAX_FILES} arquivos permitidos. Você tentou adicionar ${selectedFiles.length} arquivo(s), mas já tem ${files.length}.`);
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
      setMessage(`⚠️ ${errors.length} arquivo(s) rejeitado(s):\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setMessage('');
      setProgress(0);
      setProgressLabel('');
      setCurrentFileIndex(0);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMarketingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validation = await validateFile(file, marketingFiles.length);
      if (validation.valid) {
        validFiles.push(file);
      }
      // Erros de validação são tratados pelo componente UploadSection
    }

    if (validFiles.length > 0) {
      setMarketingFiles([...marketingFiles, ...validFiles]);
    }
  };

  const removeMarketingFile = (index: number) => {
    setMarketingFiles(marketingFiles.filter((_, i) => i !== index));
  };

  const handleValoresCidadeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validation = await validateFile(file, valoresCidadeFiles.length);
      if (validation.valid) {
        validFiles.push(file);
      }
      // Erros de validação são tratados pelo componente UploadSection
    }

    if (validFiles.length > 0) {
      setValoresCidadeFiles([...valoresCidadeFiles, ...validFiles]);
    }
  };

  const removeValoresCidadeFile = (index: number) => {
    setValoresCidadeFiles(valoresCidadeFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage('Por favor, selecione pelo menos um arquivo.');
      return;
    }

    // Verificar rate limiting
    const rateLimit = uploadRateLimiter();
    if (!rateLimit.allowed) {
      const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
      setMessage(`⚠️ Muitos uploads recentes. Aguarde ${waitTime} minuto(s) antes de tentar novamente.`);
      return;
    }

    setUploading(true);
    setMessage('');
    setProgress(0);
    setCurrentFileIndex(0);

    const totalFiles = files.length;
    let successCount = 0;
    let errorCount = 0;

    for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
      const file = files[fileIdx];
      setCurrentFileIndex(fileIdx + 1);
      setProgressLabel(`Processando arquivo ${fileIdx + 1}/${totalFiles}: ${file.name}`);

      try {
        setProgressLabel('Processando dados...');
        setProgress(10);

        const sanitizedData = await processCorridasFile(file);

        const totalRows = sanitizedData.length;
        const fileProgress = (fileIdx / totalFiles) * 100;
        setProgress(fileProgress);

        // Usar função insertInBatches que detecta automaticamente se precisa usar RPC
        const { inserted, errors: insertErrors } = await insertInBatches('dados_corridas', sanitizedData, {
          batchSize: BATCH_SIZE,
          onProgress: (insertedRows, total) => {
            const batchProgress = (insertedRows / total) * (100 / totalFiles);
            setProgress(fileProgress + batchProgress);
            setProgressLabel(`Arquivo ${fileIdx + 1}/${totalFiles}: ${insertedRows}/${total} linhas`);
          }
        });

        if (insertErrors.length > 0) {
          throw new Error(`Erros durante inserção: ${insertErrors.join('; ')}`);
        }

        successCount++;
      } catch (error: any) {
        safeLog.error(`Erro no arquivo ${file.name}:`, error);
        errorCount++;
      }
    }

    setProgress(100);
    setProgressLabel('Concluído!');
    
    if (errorCount === 0) {
      setMessage(`✅ Todos os ${successCount} arquivo(s) foram importados com sucesso! 
        
⏳ Atualizando dados agregados... Isso pode levar 2-4 minutos para as visualizações principais.

💡 Dica: As visualizações secundárias serão atualizadas em background. Você pode fechar esta página e voltar mais tarde.`);
    } else {
      setMessage(`⚠️ ${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro. Verifique os logs.`);
    }
    
    // ⚠️ OTIMIZAÇÃO: Refresh prioritário e assíncrono
    // 1. Atualiza MVs críticas imediatamente (2-4 minutos)
    // 2. Marca outras MVs para refresh em background
    if (errorCount === 0) {
      try {
        // Delay antes de iniciar refresh (permite que inserções terminem)
        setTimeout(async () => {
          try {
            // Passo 1: Marcar todas as MVs relacionadas como precisando refresh
            await safeRpc('refresh_mvs_after_bulk_insert', { delay_seconds: 5 }, {
              timeout: 30000,
              validateParams: false
            });

            // Passo 2: Atualizar apenas MVs críticas imediatamente (prioridade 1)
            const { data, error } = await safeRpc<{
              success: boolean;
              total_duration_seconds?: number;
              views_refreshed?: number;
              results?: Array<{
                view: string;
                success: boolean;
                duration_seconds?: number;
                method?: string;
              }>;
            }>('refresh_mvs_prioritized', { refresh_critical_only: true }, {
              timeout: 300000, // 5 minutos para MVs críticas
              validateParams: false
            });
            
            if (error) {
              const errorCode = (error as any)?.code;
              const is404 = errorCode === 'PGRST116' || errorCode === '42883' || (error as any)?.message?.includes('404');
              if (!is404 && IS_DEV) {
                safeLog.warn('Refresh prioritário não disponível, será processado automaticamente');
              }
            } else if (data?.success && IS_DEV) {
              const duration = data.total_duration_seconds ? `${(data.total_duration_seconds / 60).toFixed(1)} min` : 'N/A';
              const viewsCount = data.views_refreshed || 0;
              safeLog.info(`✅ Refresh de MVs críticas concluído: ${viewsCount} MVs em ${duration}`);
              
              // Log detalhado de cada MV
              if (data.results) {
                data.results.forEach((result) => {
                  if (result.success) {
                    const mvDuration = result.duration_seconds ? `${result.duration_seconds.toFixed(1)}s` : 'N/A';
                    safeLog.info(`  - ${result.view}: ${result.method || 'NORMAL'} em ${mvDuration}`);
                  } else {
                    safeLog.warn(`  - ${result.view}: FALHOU`);
                  }
                });
              }
            }

            // Passo 3: Iniciar refresh assíncrono das MVs secundárias em background
            // Isso será processado automaticamente pelo worker
            setTimeout(async () => {
              try {
                await safeRpc('refresh_pending_mvs', {}, {
                  timeout: 600000, // 10 minutos para todas as MVs secundárias
                  validateParams: false
                });
                if (IS_DEV) {
                  safeLog.info('Refresh de MVs secundárias iniciado em background');
                }
              } catch (e) {
                if (IS_DEV) {
                  safeLog.warn('Refresh de MVs secundárias não disponível, será processado automaticamente');
                }
              }
            }, 5000); // Delay de 5 segundos antes de iniciar MVs secundárias
            
          } catch (e) {
            // Silenciar erros - o refresh será feito automaticamente
            if (IS_DEV) {
              safeLog.warn('Refresh prioritário não disponível, será processado automaticamente');
            }
          }
        }, 2000); // Delay de 2 segundos após upload
      } catch (e) {
        // Silenciar erros - o refresh será feito automaticamente
        if (IS_DEV) {
          safeLog.warn('Erro ao iniciar refresh de MVs');
        }
      }
    }

    setFiles([]);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setUploading(false);
  };

  const handleMarketingUpload = async () => {
    await marketingUpload.uploadFiles(marketingFiles);
    if (!marketingUpload.uploading) {
      setMarketingFiles([]);
      const marketingFileInput = document.querySelector('input[type="file"][data-marketing="true"]') as HTMLInputElement;
      if (marketingFileInput) marketingFileInput.value = '';
    }
  };

  const handleValoresCidadeUpload = async () => {
    await valoresCidadeUpload.uploadFiles(valoresCidadeFiles);
    if (!valoresCidadeUpload.uploading) {
      setValoresCidadeFiles([]);
      const valoresCidadeFileInput = document.querySelector('input[type="file"][data-valores-cidade="true"]') as HTMLInputElement;
      if (valoresCidadeFileInput) valoresCidadeFileInput.value = '';
    }
  };

  const handleRefreshMVs = async () => {
    setRefreshing(true);
    setRefreshMessage('🔄 Preparando atualização...');
    setRefreshProgress(0);
    setRefreshCompleted(0);
    setRefreshTotal(0);
    setRefreshProgressLabel('');
    
    try {
      // Passo 1: Obter lista de MVs pendentes
      const { data: pendingData, error: pendingError } = await safeRpc<Array<{
        mv_name: string;
        priority: number;
        needs_refresh: boolean;
        last_refresh: string | null;
      }>>('get_pending_mvs', {}, {
        timeout: 30000,
        validateParams: false
      });

      if (pendingError) {
        setRefreshMessage(`❌ Erro ao obter lista de MVs: ${(pendingError as any)?.message || 'Erro desconhecido'}`);
        safeLog.error('Erro ao obter MVs pendentes:', pendingError);
        setRefreshing(false);
        return;
      }

      if (!pendingData || pendingData.length === 0) {
        setRefreshMessage('✅ Nenhuma Materialized View precisa ser atualizada!');
        setRefreshing(false);
        return;
      }

      const totalMVs = pendingData.length;
      setRefreshTotal(totalMVs);
      setRefreshMessage(`🔄 Atualizando ${totalMVs} Materialized Views...`);
      setRefreshProgressLabel(`0/${totalMVs} atualizadas`);

      let successCount = 0;
      let failCount = 0;
      const failedViews: string[] = [];
      const startTime = Date.now();

      // Passo 2: Processar cada MV individualmente
      for (let i = 0; i < pendingData.length; i++) {
        const mv = pendingData[i];
        const currentIndex = i + 1;
        
        setRefreshProgressLabel(`Atualizando ${currentIndex}/${totalMVs}: ${mv.mv_name}`);
        // Atualizar progresso antes de iniciar (mostra que está processando)
        setRefreshProgress(((currentIndex - 1) / totalMVs) * 100);

        try {
          const { data: refreshData, error: refreshError } = await safeRpc<{
            success: boolean;
            view: string;
            duration_seconds?: number;
            method?: string;
            error?: string;
            warning?: string;
          }>('refresh_single_mv_with_progress', { mv_name_param: mv.mv_name }, {
            timeout: 300000, // 5 minutos por MV (mais que suficiente)
            validateParams: false
          });

          // Atualizar progresso após processar
          setRefreshProgress((currentIndex / totalMVs) * 100);
          setRefreshCompleted(currentIndex);

          // Verificar se houve erro na chamada RPC
          if (refreshError) {
            // Verificar se é erro de timeout ou erro real
            const errorCode = (refreshError as any)?.code;
            const errorMessage = String((refreshError as any)?.message || '');
            const isTimeout = errorCode === 'TIMEOUT' || errorMessage.includes('timeout') || errorMessage.includes('demorou muito');
            
            if (isTimeout) {
              // Timeout - verificar se a MV foi atualizada mesmo assim (pode ter sido atualizada antes do timeout)
              // Não contar como falha imediatamente, mas verificar depois
              safeLog.warn(`Timeout ao atualizar ${mv.mv_name} (verificando se foi atualizada mesmo assim)`);
              // Continuar e verificar depois se needs_refresh foi atualizado
            } else {
              // Erro real
              failCount++;
              failedViews.push(mv.mv_name);
              safeLog.error(`Erro ao atualizar ${mv.mv_name}:`, refreshError);
            }
          } else if (refreshData) {
            // A função RPC retorna o resultado dentro de uma propriedade com o nome da função
            const result = (refreshData as any).refresh_single_mv_with_progress || refreshData;
            
            // Verificar se a função retornou sucesso
            const success = result?.success === true;
            const viewName = result?.view || mv.mv_name;
            const duration = result?.duration_seconds;
            const method = result?.method;
            const warning = result?.warning;
            const error = result?.error;
            
            if (success) {
              successCount++;
              const durationStr = duration 
                ? `${duration.toFixed(1)}s` 
                : 'N/A';
              const methodStr = method || (warning ? 'FALLBACK' : 'NORMAL');
              safeLog.info(`✅ ${viewName} atualizada em ${durationStr} (${methodStr})`);
            } else if (warning && (warning.includes('fallback') || warning.includes('CONCURRENTLY falhou'))) {
              // Fallback funcionou - considerar sucesso
              successCount++;
              const durationStr = duration 
                ? `${duration.toFixed(1)}s` 
                : 'N/A';
              safeLog.info(`✅ ${viewName} atualizada em ${durationStr} (fallback - ${method || 'NORMAL'})`);
            } else {
              // Falha real
              failCount++;
              failedViews.push(mv.mv_name);
              const errorMsg = error || 'Erro desconhecido';
              safeLog.warn(`Falha ao atualizar ${mv.mv_name}: ${errorMsg}`);
            }
          } else {
            // Sem dados e sem erro - situação estranha, considerar falha
            failCount++;
            failedViews.push(mv.mv_name);
            safeLog.warn(`Resposta vazia ao atualizar ${mv.mv_name}`);
          }
        } catch (error: any) {
          failCount++;
          failedViews.push(mv.mv_name);
          setRefreshProgress((currentIndex / totalMVs) * 100);
          setRefreshCompleted(currentIndex);
          safeLog.error(`Erro ao atualizar ${mv.mv_name}:`, error);
        }

        // Pequeno delay entre MVs para não sobrecarregar
        if (i < pendingData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Passo 3: Resumo final
      const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      setRefreshProgress(100);
      setRefreshCompleted(totalMVs);

      if (failCount === 0) {
        setRefreshMessage(`✅ Todas as ${totalMVs} Materialized Views foram atualizadas com sucesso em ${totalDuration} minutos!`);
      } else {
        setRefreshMessage(
          `✅ ${successCount} de ${totalMVs} Materialized Views atualizadas com sucesso em ${totalDuration} minutos. ` +
          `${failCount} falharam${failedViews.length > 0 ? `: ${failedViews.slice(0, 3).join(', ')}${failedViews.length > 3 ? '...' : ''}` : ''}.`
        );
      }
      
      safeLog.info(`✅ Refresh concluído: ${successCount}/${totalMVs} MVs atualizadas em ${totalDuration} minutos`);
    } catch (error: any) {
      setRefreshMessage(`❌ Erro ao atualizar: ${error?.message || 'Erro desconhecido'}`);
      safeLog.error('Erro ao atualizar MVs:', error);
    } finally {
      setRefreshing(false);
      // Manter progresso por alguns segundos antes de resetar
      setTimeout(() => {
        setRefreshProgress(0);
        setRefreshProgressLabel('');
        setRefreshTotal(0);
        setRefreshCompleted(0);
      }, 5000);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-300">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autorizado, não renderizar nada (já foi redirecionado)
  if (!isAuthorized) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mx-auto w-full">
          {/* Card Principal */}
          <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl dark:border-blue-900 dark:bg-slate-900">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-4xl">📊</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Upload de Dados</h1>
              <p className="mt-2 text-blue-100">Importe sua planilha Excel para o sistema</p>
            </div>

            {/* Conteúdo */}
            <div className="p-8">
              {/* Área de Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center transition-all duration-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:border-blue-600">
                  {files.length === 0 ? (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <span className="text-3xl">📁</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Clique para selecionar ou arraste os arquivos aqui
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Você pode selecionar múltiplos arquivos de uma vez
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Formatos aceitos: .xlsx, .xls</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <span className="text-3xl">✅</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                          {files.length} arquivo(s) selecionado(s)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Arquivos */}
              {files.length > 0 && !uploading && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="rounded-lg bg-rose-100 p-2 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de Upload */}
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="mt-6 w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>
                      {currentFileIndex > 0 && `Arquivo ${currentFileIndex}/${files.length} - `}
                      Processando...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span>Enviar {files.length} Arquivo(s)</span>
                  </div>
                )}
              </button>

              {/* Barra de Progresso */}
              {uploading && (
                <div className="mt-6 space-y-3 animate-in fade-in duration-300">
                  <div className="overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {progressLabel && (
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{progressLabel}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{progress.toFixed(1)}% concluído</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de Status */}
              {message && (
                <div
                  className={`mt-6 animate-in fade-in slide-in-from-top-2 rounded-xl border-2 p-4 duration-300 ${
                    message.includes('✅')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : message.includes('❌')
                      ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                      : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
                  }`}
                >
                  <p className="font-medium">{message}</p>
                </div>
              )}

              {/* Botão de Atualizar MVs */}
              <div className="mt-8 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 dark:border-amber-800 dark:from-amber-950/30 dark:to-yellow-950/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
                      🔄 Atualizar Materialized Views
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Após fazer upload de novos dados, clique aqui para atualizar todas as Materialized Views e garantir que os dados estejam atualizados no dashboard.
                    </p>
                    
                    {/* Barra de Progresso */}
                    {refreshing && (
                      <div className="mt-4 space-y-2">
                        {refreshTotal > 0 ? (
                          <>
                            <div className="overflow-hidden rounded-full bg-amber-200 shadow-inner dark:bg-amber-900">
                              <div
                                className="h-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 shadow-lg transition-all duration-500"
                                style={{ width: `${Math.max(0, Math.min(100, refreshProgress))}%` }}
                              ></div>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-amber-900 dark:text-amber-100">
                                {refreshProgressLabel || `${refreshCompleted}/${refreshTotal} atualizadas`}
                              </p>
                              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                {Math.max(0, Math.min(100, refreshProgress)).toFixed(1)}% concluído
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                              Preparando atualização...
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {refreshMessage && (
                      <div className={`mt-3 rounded-lg p-3 text-sm ${
                        refreshMessage.includes('✅')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                          : refreshMessage.includes('❌')
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                      }`}>
                        {refreshMessage}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleRefreshMVs}
                    disabled={refreshing}
                    className="flex-shrink-0 transform rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
                  >
                    {refreshing ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Atualizando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔄</span>
                        <span>Atualizar</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Informações e Dicas */}
              <div className="mt-8 rounded-xl bg-blue-50 p-6 dark:bg-blue-950/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Dicas importantes</h3>
                    <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>Certifique-se de que a planilha contém todas as colunas necessárias</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>O sistema processa automaticamente grandes volumes de dados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>Aguarde a conclusão do upload antes de navegar para outra página</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>Após o upload, os dados estarão disponíveis imediatamente no dashboard</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Colunas Esperadas */}
              <details className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  📋 Ver colunas esperadas na planilha
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {Object.keys(COLUMN_MAP).map((col) => (
                    <div key={col} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                      <span className="text-blue-600">✓</span>
                      <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Grid de Uploads - Marketing e Valores por Cidade lado a lado */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 mt-8">
            {/* Seção de Upload Marketing */}
            <UploadSection
              title="Upload de Dados Marketing"
              description="Importe planilha de Marketing (sobrescreve dados anteriores)"
              icon="📢"
              files={marketingFiles}
              onFileChange={handleMarketingFileChange}
              onRemoveFile={removeMarketingFile}
              onUpload={handleMarketingUpload}
              uploading={marketingUpload.uploading}
              progress={marketingUpload.progress}
              progressLabel={marketingUpload.progressLabel}
              message={marketingUpload.message}
              variant="marketing"
              dataAttribute="marketing"
              gradientFrom="from-purple-600"
              gradientTo="to-pink-600"
              tips={[
                { icon: '⚠️', text: 'Sobrescrita: Todos os dados anteriores serão removidos e substituídos pelos novos' },
                { text: 'Formato de data: DD/MM/YYYY (ex: 14/11/2025)' },
                { text: 'Todos os campos são opcionais' },
              ]}
              expectedColumns={Object.keys(MARKETING_COLUMN_MAP)}
            />

            {/* Seção de Upload Valores por Cidade */}
            <UploadSection
              title="Upload de Valores por Cidade"
              description="Importe planilha de Valores por Cidade (sobrescreve dados anteriores)"
              icon="💰"
              files={valoresCidadeFiles}
              onFileChange={handleValoresCidadeFileChange}
              onRemoveFile={removeValoresCidadeFile}
              onUpload={handleValoresCidadeUpload}
              uploading={valoresCidadeUpload.uploading}
              progress={valoresCidadeUpload.progress}
              progressLabel={valoresCidadeUpload.progressLabel}
              message={valoresCidadeUpload.message}
              variant="valores"
              dataAttribute="valores-cidade"
              gradientFrom="from-emerald-600"
              gradientTo="to-teal-600"
              tips={[
                { icon: '⚠️', text: 'Sobrescrita: Todos os dados anteriores serão removidos e substituídos pelos novos' },
                { text: 'Formato de data: DD/MM/YYYY (ex: 14/11/2025)' },
                { text: 'Colunas obrigatórias: DATA, ID, CIDADE, VALOR' },
                { text: 'O valor deve ser numérico (aceita vírgula ou ponto como separador decimal)' },
              ]}
              expectedColumns={Object.keys(VALORES_CIDADE_COLUMN_MAP)}
            />
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}