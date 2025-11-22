'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UploadSection } from '@/components/upload/UploadSection';
import { UploadRefreshMVs } from '@/components/upload/UploadRefreshMVs';
import { CorridasUploadArea } from '@/components/upload/CorridasUploadArea';
import { CorridasFileList } from '@/components/upload/CorridasFileList';
import { CorridasUploadButton } from '@/components/upload/CorridasUploadButton';
import { CorridasUploadProgress } from '@/components/upload/CorridasUploadProgress';
import { CorridasUploadMessage } from '@/components/upload/CorridasUploadMessage';
import { useUploadAuth } from '@/hooks/useUploadAuth';
import { useCorridasUpload } from '@/hooks/useCorridasUpload';
import { useFileUpload } from '@/hooks/useFileUpload';
import { validateFile } from '@/utils/fileValidation';
import {
  COLUMN_MAP,
  MARKETING_COLUMN_MAP,
  VALORES_CIDADE_COLUMN_MAP,
} from '@/constants/upload';
import { marketingTransformers, valoresCidadeTransformers } from '@/utils/uploadTransformers';

export default function UploadPage() {
  const { loading, isAuthorized } = useUploadAuth();
  const [marketingFiles, setMarketingFiles] = useState<File[]>([]);
  const [valoresCidadeFiles, setValoresCidadeFiles] = useState<File[]>([]);

  // Hook para upload de corridas
  const corridasUpload = useCorridasUpload();

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
    refreshRpcFunction: 'refresh_mv_entregadores_marketing',
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

  const handleMarketingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validation = await validateFile(file, marketingFiles.length);
      if (validation.valid) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setMarketingFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeMarketingFile = (index: number) => {
    setMarketingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleValoresCidadeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validation = await validateFile(file, valoresCidadeFiles.length);
      if (validation.valid) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setValoresCidadeFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeValoresCidadeFile = (index: number) => {
    setValoresCidadeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMarketingUpload = async () => {
    await marketingUpload.uploadFiles(marketingFiles);
    if (!marketingUpload.uploading) {
      setMarketingFiles([]);
      const marketingFileInput = document.querySelector(
        'input[type="file"][data-marketing="true"]'
      ) as HTMLInputElement;
      if (marketingFileInput) marketingFileInput.value = '';
    }
  };

  const handleValoresCidadeUpload = async () => {
    await valoresCidadeUpload.uploadFiles(valoresCidadeFiles);
    if (!valoresCidadeUpload.uploading) {
      setValoresCidadeFiles([]);
      const valoresCidadeFileInput = document.querySelector(
        'input[type="file"][data-valores-cidade="true"]'
      ) as HTMLInputElement;
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mx-auto w-full">
            {/* Título da Página */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Upload de Dados</h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Importe suas planilhas Excel para o sistema</p>
            </div>

            {/* Grid de Uploads - Três seções lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seção de Upload Corridas */}
              <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-900 dark:bg-slate-900 flex flex-col h-full">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Corridas</h2>
                  <p className="mt-1 text-sm text-blue-100">Upload de dados de corridas</p>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col overflow-auto">
                  <CorridasUploadArea
                    files={corridasUpload.files}
                    onFileChange={corridasUpload.handleFileChange}
                    uploading={corridasUpload.uploading}
                  />
                  <CorridasFileList
                    files={corridasUpload.files}
                    onRemoveFile={corridasUpload.removeFile}
                    uploading={corridasUpload.uploading}
                  />
                  <CorridasUploadButton
                    filesCount={corridasUpload.files.length}
                    uploading={corridasUpload.uploading}
                    currentFileIndex={corridasUpload.currentFileIndex}
                    onClick={corridasUpload.handleUpload}
                  />
                  <CorridasUploadProgress
                    uploading={corridasUpload.uploading}
                    progress={corridasUpload.progress}
                    progressLabel={corridasUpload.progressLabel}
                  />
                  <CorridasUploadMessage message={corridasUpload.message} />

                  {/* Informações e Dicas */}
                  <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div className="flex-1">
                        <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-200">
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-blue-600">•</span>
                            <span>Certifique-se de que a planilha contém todas as colunas necessárias</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-blue-600">•</span>
                            <span>O sistema processa automaticamente grandes volumes de dados</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-blue-600">•</span>
                            <span>Aguarde a conclusão do upload antes de navegar para outra página</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-blue-600">•</span>
                            <span>Após o upload, os dados estarão disponíveis imediatamente no dashboard</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Colunas Esperadas */}
                  <details className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      📋 Ver colunas esperadas
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                      {Object.keys(COLUMN_MAP).map((col) => (
                        <div key={col} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 dark:bg-slate-900">
                          <span className="text-blue-600">✓</span>
                          <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              {/* Seção de Upload Marketing */}
              <UploadSection
                title="Marketing"
                description="Upload de dados de Marketing"
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
                  { text: 'Formato de data: DD/MM/YYYY' },
                  { text: 'Todos os campos são opcionais' },
                ]}
                expectedColumns={Object.keys(MARKETING_COLUMN_MAP)}
              />

              {/* Seção de Upload Valores por Cidade */}
              <UploadSection
                title="Valores por Cidade"
                description="Upload de valores por cidade"
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
                  { text: 'Formato de data: DD/MM/YYYY' },
                  { text: 'Colunas obrigatórias: DATA, ID, CIDADE, VALOR' },
                ]}
                expectedColumns={Object.keys(VALORES_CIDADE_COLUMN_MAP)}
              />
            </div>

            {/* Botão de Atualizar MVs - Centralizado abaixo */}
            <div className="mt-8 flex justify-center">
              <UploadRefreshMVs />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}