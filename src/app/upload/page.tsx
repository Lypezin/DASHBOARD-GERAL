'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { uploadRateLimiter } from '@/lib/rateLimiter';
import { safeRpc } from '@/lib/rpcWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
      } else {
        setMarketingMessage(`⚠️ ${validation.error}`);
      }
    }

    if (validFiles.length > 0) {
      setMarketingFiles([...marketingFiles, ...validFiles]);
      setMarketingMessage('');
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
      } else {
        setValoresCidadeMessage(`⚠️ ${validation.error}`);
      }
    }

    if (validFiles.length > 0) {
      setValoresCidadeFiles([...valoresCidadeFiles, ...validFiles]);
      setValoresCidadeMessage('');
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
        let insertedRows = 0;

        const fileProgress = (fileIdx / totalFiles) * 100;
        setProgress(fileProgress);

        for (let i = 0; i < totalRows; i += BATCH_SIZE) {
          const batch = sanitizedData.slice(i, i + BATCH_SIZE);
          const { error: batchError } = await supabase.from('dados_corridas').insert(batch, { count: 'exact' });

          if (batchError) {
            throw new Error(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError.message}`);
          }

          insertedRows += batch.length;
          const batchProgress = (insertedRows / totalRows) * (100 / totalFiles);
          setProgress(fileProgress + batchProgress);
          setProgressLabel(`Arquivo ${fileIdx + 1}/${totalFiles}: ${insertedRows}/${totalRows} linhas`);
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
        
⏳ Aguarde alguns minutos para os dados agregados serem processados, depois atualize a página.

💡 Dica: Com grandes volumes de dados, o processamento pode levar até 10 minutos. Você pode fechar esta página e voltar mais tarde.`);
    } else {
      setMessage(`⚠️ ${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro. Verifique os logs.`);
    }
    
    // Tentar refresh assíncrono da materialized view (não bloqueia o upload)
    try {
      // Usar setTimeout para não bloquear a UI
      setTimeout(async () => {
        try {
          const { error } = await safeRpc('refresh_mv_aderencia_async', {}, {
            timeout: 60000, // 60 segundos para refresh de MV
            validateParams: false
          });
          
          if (error) {
            // Ignorar erros 404 silenciosamente (função pode não existir)
            const errorCode = (error as any)?.code;
            const is404 = errorCode === 'PGRST116' || errorCode === '42883' || (error as any)?.message?.includes('404');
            if (!is404 && IS_DEV) {
              safeLog.warn('Refresh assíncrono não disponível, será processado automaticamente');
            }
          } else if (IS_DEV) {
            safeLog.info('Refresh da materialized view iniciado em segundo plano');
          }
        } catch (e) {
          // Silenciar erros - o refresh será feito automaticamente
          if (IS_DEV) {
            safeLog.warn('Refresh assíncrono não disponível, será processado automaticamente');
          }
        }
      }, 1000);
    } catch (e) {
      // Silenciar erros - o refresh será feito automaticamente
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
        <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl">
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

          {/* Seção de Upload Marketing */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-2xl dark:border-purple-900 dark:bg-slate-900">
            {/* Header do Card Marketing */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-4xl">📢</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Upload de Dados Marketing</h2>
              <p className="mt-2 text-purple-100">Importe planilha de Marketing (sobrescreve dados anteriores)</p>
            </div>

            {/* Conteúdo Marketing */}
            <div className="p-8">
              {/* Área de Upload Marketing */}
              <div className="relative">
                <input
                  type="file"
                  data-marketing="true"
                  accept=".xlsx, .xls"
                  multiple
                  onChange={handleMarketingFileChange}
                  disabled={marketingUpload.uploading}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-12 text-center transition-all duration-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-purple-700 dark:from-purple-950/30 dark:to-pink-950/30 dark:hover:border-purple-600">
                  {marketingFiles.length === 0 ? (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-3xl">📁</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Clique para selecionar ou arraste os arquivos aqui
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          ⚠️ Atenção: Os dados anteriores serão substituídos
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
                          {marketingFiles.length} arquivo(s) selecionado(s)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Arquivos Marketing */}
              {marketingFiles.length > 0 && !marketingUpload.uploading && (
                <div className="mt-4 space-y-2">
                  {marketingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30"
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
                        onClick={() => removeMarketingFile(index)}
                        className="rounded-lg bg-rose-100 p-2 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de Upload Marketing */}
              <button
                onClick={handleMarketingUpload}
                disabled={marketingUpload.uploading || marketingFiles.length === 0}
                className="mt-6 w-full transform rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
              >
                {marketingUpload.uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span>Enviar {marketingFiles.length} Arquivo(s) Marketing</span>
                  </div>
                )}
              </button>

              {/* Barra de Progresso Marketing */}
              {marketingUpload.uploading && (
                <div className="mt-6 space-y-3 animate-in fade-in duration-300">
                  <div className="overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 shadow-lg transition-all duration-500"
                      style={{ width: `${marketingUpload.progress}%` }}
                    ></div>
                  </div>
                  {marketingUpload.progressLabel && (
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{marketingUpload.progressLabel}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{marketingUpload.progress.toFixed(1)}% concluído</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de Status Marketing */}
              {marketingUpload.message && (
                <div
                  className={`mt-6 animate-in fade-in slide-in-from-top-2 rounded-xl border-2 p-4 duration-300 ${
                    marketingUpload.message.includes('✅')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : marketingUpload.message.includes('❌')
                      ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                      : 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-200'
                  }`}
                >
                  <p className="font-medium">{marketingUpload.message}</p>
                </div>
              )}

              {/* Informações Marketing */}
              <div className="mt-8 rounded-xl bg-purple-50 p-6 dark:bg-purple-950/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-900 dark:text-purple-100">Importante sobre Marketing</h3>
                    <ul className="mt-3 space-y-2 text-sm text-purple-800 dark:text-purple-200">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-purple-600">⚠️</span>
                        <span><strong>Sobrescrita:</strong> Todos os dados anteriores serão removidos e substituídos pelos novos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-purple-600">•</span>
                        <span>Formato de data: <strong>DD/MM/YYYY</strong> (ex: 14/11/2025)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-purple-600">•</span>
                        <span>Todos os campos são opcionais</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Colunas Esperadas Marketing */}
              <details className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  📋 Ver colunas esperadas na planilha Marketing
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {Object.keys(MARKETING_COLUMN_MAP).map((col) => (
                    <div key={col} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                      <span className={col.includes('*') ? 'text-red-600' : 'text-purple-600'}>
                        {col.includes('*') ? '⚠️' : '✓'}
                      </span>
                      <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Seção de Upload Valores por Cidade */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl dark:border-emerald-900 dark:bg-slate-900">
            {/* Header do Card Valores por Cidade */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-4xl">💰</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Upload de Valores por Cidade</h2>
              <p className="mt-2 text-emerald-100">Importe planilha de Valores por Cidade (sobrescreve dados anteriores)</p>
            </div>

            {/* Conteúdo Valores por Cidade */}
            <div className="p-8">
              {/* Área de Upload Valores por Cidade */}
              <div className="relative">
                <input
                  type="file"
                  data-valores-cidade="true"
                  accept=".xlsx, .xls"
                  multiple
                  onChange={handleValoresCidadeFileChange}
                  disabled={valoresCidadeUpload.uploading}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-12 text-center transition-all duration-300 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-100 hover:to-teal-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-teal-950/30 dark:hover:border-emerald-600">
                  {valoresCidadeFiles.length === 0 ? (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <span className="text-3xl">📁</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Clique para selecionar ou arraste os arquivos aqui
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          ⚠️ Atenção: Os dados anteriores serão substituídos
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
                          {valoresCidadeFiles.length} arquivo(s) selecionado(s)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Arquivos Valores por Cidade */}
              {valoresCidadeFiles.length > 0 && !valoresCidadeUpload.uploading && (
                <div className="mt-4 space-y-2">
                  {valoresCidadeFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30"
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
                        onClick={() => removeValoresCidadeFile(index)}
                        className="rounded-lg bg-rose-100 p-2 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de Upload Valores por Cidade */}
              <button
                onClick={handleValoresCidadeUpload}
                disabled={valoresCidadeUpload.uploading || valoresCidadeFiles.length === 0}
                className="mt-6 w-full transform rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
              >
                {valoresCidadeUpload.uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span>Enviar {valoresCidadeFiles.length} Arquivo(s) Valores por Cidade</span>
                  </div>
                )}
              </button>

              {/* Barra de Progresso Valores por Cidade */}
              {valoresCidadeUpload.uploading && (
                <div className="mt-6 space-y-3 animate-in fade-in duration-300">
                  <div className="overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg transition-all duration-500"
                      style={{ width: `${valoresCidadeUpload.progress}%` }}
                    ></div>
                  </div>
                  {valoresCidadeUpload.progressLabel && (
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{valoresCidadeUpload.progressLabel}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{valoresCidadeUpload.progress.toFixed(1)}% concluído</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de Status Valores por Cidade */}
              {valoresCidadeUpload.message && (
                <div
                  className={`mt-6 animate-in fade-in slide-in-from-top-2 rounded-xl border-2 p-4 duration-300 ${
                    valoresCidadeUpload.message.includes('✅')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : valoresCidadeUpload.message.includes('❌')
                      ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                  }`}
                >
                  <p className="font-medium">{valoresCidadeUpload.message}</p>
                </div>
              )}

              {/* Informações Valores por Cidade */}
              <div className="mt-8 rounded-xl bg-emerald-50 p-6 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Importante sobre Valores por Cidade</h3>
                    <ul className="mt-3 space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">⚠️</span>
                        <span><strong>Sobrescrita:</strong> Todos os dados anteriores serão removidos e substituídos pelos novos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>Formato de data: <strong>DD/MM/YYYY</strong> (ex: 14/11/2025)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>Colunas obrigatórias: <strong>DATA</strong>, <strong>ID</strong>, <strong>CIDADE</strong>, <strong>VALOR</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span>O valor deve ser numérico (aceita vírgula ou ponto como separador decimal)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Colunas Esperadas Valores por Cidade */}
              <details className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  📋 Ver colunas esperadas na planilha Valores por Cidade
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {Object.keys(VALORES_CIDADE_COLUMN_MAP).map((col) => (
                    <div key={col} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                      <span className="text-emerald-600">✓</span>
                      <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}