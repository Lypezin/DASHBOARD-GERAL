'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UploadSection } from '@/components/upload/UploadSection';
import { UploadRefreshMVs } from '@/components/upload/UploadRefreshMVs';
import { UploadHeader } from '@/components/upload/UploadHeader';
import {
  COLUMN_MAP,
  MARKETING_COLUMN_MAP,
  VALORES_CIDADE_COLUMN_MAP,
} from '@/constants/upload';
import { PageLoading } from '@/components/ui/loading';
import { BarChart2, Megaphone, DollarSign } from 'lucide-react';
import { useUploadPageLogic } from './useUploadPageLogic';

export default function UploadPage() {
  const {
    loading, isAuthorized, user, organizations, selectedOrgId, isLoadingOrgs,
    setSelectedOrgId, marketingState, valoresCidadeState, corridasUpload,
    marketingUpload, valoresCidadeUpload, handleMarketingUpload, handleValoresCidadeUpload
  } = useUploadPageLogic();

  if (loading) return <PageLoading text="Verificando permissões..." />;
  if (!isAuthorized) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <UploadHeader
            isAuthorized={isAuthorized} user={user}
            organizations={organizations} selectedOrgId={selectedOrgId}
            isLoadingOrgs={isLoadingOrgs} onOrgChange={setSelectedOrgId}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UploadSection
              title="Corridas" description="Upload de dados de corridas"
              icon={<BarChart2 className="h-6 w-6" />}
              files={corridasUpload.files} onFileChange={corridasUpload.handleFileChange}
              onRemoveFile={corridasUpload.removeFile} onUpload={corridasUpload.handleUpload}
              uploading={corridasUpload.uploading} progress={corridasUpload.progress}
              progressLabel={corridasUpload.progressLabel} message={corridasUpload.message}
              variant="default" dataAttribute="corridas"
              tips={[
                { text: 'Certifique-se de que a planilha contém todas as colunas necessárias' },
                { text: 'O sistema processa automaticamente grandes volumes de dados' },
                { text: 'Aguarde a conclusão do upload antes de navegar' },
              ]}
              expectedColumns={Object.keys(COLUMN_MAP)} isRefreshingMVs={corridasUpload.isRefreshingMVs}
              mvRefreshProgress={corridasUpload.mvRefreshProgress} mvRefreshStatus={corridasUpload.mvRefreshStatus}
            />

            <UploadSection
              title="Marketing" description="Upload de dados de Marketing"
              icon={<Megaphone className="h-6 w-6" />}
              files={marketingState.files} onFileChange={marketingState.handleFileChange}
              onRemoveFile={marketingState.removeFile} onUpload={handleMarketingUpload}
              uploading={marketingUpload.uploading} progress={marketingUpload.progress}
              progressLabel={marketingUpload.progressLabel} message={marketingUpload.message}
              variant="marketing" dataAttribute="marketing"
              tips={[
                { text: '⚠️ Sobrescrita: Todos os dados anteriores serão removidos e substituídos pelos novos' },
                { text: 'Formato de data: DD/MM/YYYY' },
                { text: 'Todos os campos são opcionais' },
              ]}
              expectedColumns={Object.keys(MARKETING_COLUMN_MAP)}
            />

            <UploadSection
              title="Valores por Cidade" description="Upload de valores por cidade"
              icon={<DollarSign className="h-6 w-6" />}
              files={valoresCidadeState.files} onFileChange={valoresCidadeState.handleFileChange}
              onRemoveFile={valoresCidadeState.removeFile} onUpload={handleValoresCidadeUpload}
              uploading={valoresCidadeUpload.uploading} progress={valoresCidadeUpload.progress}
              progressLabel={valoresCidadeUpload.progressLabel} message={valoresCidadeUpload.message}
              variant="valores" dataAttribute="valores-cidade"
              tips={[
                { text: '⚠️ Sobrescrita: Todos os dados anteriores serão removidos e substituídos pelos novos' },
                { text: 'Formato de data: DD/MM/YYYY' },
                { text: 'Colunas obrigatórias: DATA, ID, CIDADE, VALOR' },
              ]}
              expectedColumns={Object.keys(VALORES_CIDADE_COLUMN_MAP)}
            />
          </div>

          <div className="flex justify-center">
            <UploadRefreshMVs />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}