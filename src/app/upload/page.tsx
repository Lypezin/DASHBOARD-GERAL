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
import { CorridasUploadTips } from '@/components/upload/CorridasUploadTips';
import { useUploadAuth } from '@/hooks/useUploadAuth';
import { useCorridasUpload } from '@/hooks/useCorridasUpload';
import { useFileUpload } from '@/hooks/useFileUpload';
import { validateFile } from '@/utils/fileValidation';
import {
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
              <CorridasUploadArea
                files={corridasUpload.files}
                onFileChange={corridasUpload.handleFileChange}
                uploading={corridasUpload.uploading}
              />

              {/* Lista de Arquivos */}
              <CorridasFileList
                files={corridasUpload.files}
                onRemoveFile={corridasUpload.removeFile}
                uploading={corridasUpload.uploading}
              />

              {/* Botão de Upload */}
              <CorridasUploadButton
                filesCount={corridasUpload.files.length}
                uploading={corridasUpload.uploading}
                currentFileIndex={corridasUpload.currentFileIndex}
                onClick={corridasUpload.handleUpload}
              />

              {/* Barra de Progresso */}
              <CorridasUploadProgress
                uploading={corridasUpload.uploading}
                progress={corridasUpload.progress}
                progressLabel={corridasUpload.progressLabel}
              />

              {/* Mensagem de Status */}
              <CorridasUploadMessage message={corridasUpload.message} />

              {/* Botão de Atualizar MVs */}
              <UploadRefreshMVs />

              {/* Informações e Dicas */}
              <CorridasUploadTips />
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