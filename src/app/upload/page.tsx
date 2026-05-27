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
    loading, isAuthorized, user, errorMessage, organizations, selectedOrgId, isLoadingOrgs,
    setSelectedOrgId, marketingState, valoresCidadeState, corridasUpload,
    marketingUpload, valoresCidadeUpload, handleMarketingUpload, handleValoresCidadeUpload
  } = useUploadPageLogic();

  if (loading) return <PageLoading text="Verificando permissões..." />;

  if (!isAuthorized) {
    if (errorMessage) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="max-w-md rounded-xl border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-900 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Acesso ao upload indisponível</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{errorMessage}</p>
          </div>
        </div>
      );
    }

    return null;
  }

  const uploadsDisabled = isLoadingOrgs || !selectedOrgId;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] p-4 sm:p-6 md:p-10 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <UploadHeader
            isAuthorized={isAuthorized} user={user}
            organizations={organizations} selectedOrgId={selectedOrgId}
            isLoadingOrgs={isLoadingOrgs} onOrgChange={setSelectedOrgId}
          />

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <UploadSection
              title="Corridas" description="Upload de dados de corridas"
              icon={<BarChart2 className="h-5 w-5" />}
              files={corridasUpload.files} onFileChange={corridasUpload.handleFileChange}
              onRemoveFile={corridasUpload.removeFile} onUpload={corridasUpload.handleUpload}
              uploading={corridasUpload.uploading} progress={corridasUpload.progress}
              progressLabel={corridasUpload.progressLabel} message={corridasUpload.message}
              disabled={uploadsDisabled}
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
              icon={<Megaphone className="h-5 w-5" />}
              files={marketingState.files} onFileChange={marketingState.handleFileChange}
              onRemoveFile={marketingState.removeFile} onUpload={handleMarketingUpload}
              uploading={marketingUpload.uploading} progress={marketingUpload.progress}
              progressLabel={marketingUpload.progressLabel} message={marketingUpload.message}
              disabled={uploadsDisabled}
              variant="marketing" dataAttribute="marketing"
              tips={[
                { text: 'Sobrescrita: Todos os dados anteriores serão removidos' },
                { text: 'Formato de data: DD/MM/YYYY' },
              ]}
              expectedColumns={Object.keys(MARKETING_COLUMN_MAP)}
            />

            <UploadSection
              title="Valores por Cidade" description="Upload de valores por cidade"
              icon={<DollarSign className="h-5 w-5" />}
              files={valoresCidadeState.files} onFileChange={valoresCidadeState.handleFileChange}
              onRemoveFile={valoresCidadeState.removeFile} onUpload={handleValoresCidadeUpload}
              uploading={valoresCidadeUpload.uploading} progress={valoresCidadeUpload.progress}
              progressLabel={valoresCidadeUpload.progressLabel} message={valoresCidadeUpload.message}
              disabled={uploadsDisabled}
              variant="valores" dataAttribute="valores-cidade"
              tips={[
                { text: 'Sobrescrita: Todos os dados anteriores serão removidos' },
                { text: 'Colunas obrigatórias: DATA, ID, CIDADE, VALOR' },
              ]}
              expectedColumns={Object.keys(VALORES_CIDADE_COLUMN_MAP)}
            />
          </div>

          <div className="flex justify-center pb-12">
            <div className="w-full max-w-4xl">
              <UploadRefreshMVs />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
