'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UploadSection } from '@/components/upload/UploadSection';
import { UploadRefreshMVs } from '@/components/upload/UploadRefreshMVs';
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
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function UploadPage() {
  const { loading, isAuthorized } = useUploadAuth();
  const [marketingFiles, setMarketingFiles] = useState<File[]>([]);
  const [valoresCidadeFiles, setValoresCidadeFiles] = useState<File[]>([]);
  const [showRetry, setShowRetry] = useState(false);

  // Mostrar botão de retry se o loading demorar muito
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [loading]);

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Verificando permissões...</p>
          {showRetry && (
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                A verificação está demorando mais que o esperado.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          )}
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
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          {/* Título da Página */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Upload de Dados</h1>
            <p className="text-muted-foreground">
              Importe suas planilhas Excel para o sistema
            </p>
          </div>

          {/* Grid de Uploads - Três seções lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seção de Upload Corridas */}
            <UploadSection
              title="Corridas"
              description="Upload de dados de corridas"
              icon="📊"
              files={corridasUpload.files}
              onFileChange={corridasUpload.handleFileChange}
              onRemoveFile={corridasUpload.removeFile}
              onUpload={corridasUpload.handleUpload}
              uploading={corridasUpload.uploading}
              progress={corridasUpload.progress}
              progressLabel={corridasUpload.progressLabel}
              message={corridasUpload.message}
              variant="default"
              dataAttribute="corridas"
              tips={[
                { text: 'Certifique-se de que a planilha contém todas as colunas necessárias' },
                { text: 'O sistema processa automaticamente grandes volumes de dados' },
                { text: 'Aguarde a conclusão do upload antes de navegar' },
              ]}
              expectedColumns={Object.keys(COLUMN_MAP)}
            />

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
              tips={[
                { text: '⚠️ Sobrescrita: Todos os dados anteriores serão removidos e substituídos pelos novos' },
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
              tips={[
                { text: '⚠️ Sobrescrita: Todos os dados anteriores serão removidos e substituídos pelos novos' },
                { text: 'Formato de data: DD/MM/YYYY' },
                { text: 'Colunas obrigatórias: DATA, ID, CIDADE, VALOR' },
              ]}
              expectedColumns={Object.keys(VALORES_CIDADE_COLUMN_MAP)}
            />
          </div>

          {/* Botão de Atualizar MVs - Centralizado abaixo */}
          <div className="flex justify-center">
            <UploadRefreshMVs />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}