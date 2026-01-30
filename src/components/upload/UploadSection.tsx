import { memo } from 'react';
import { FileUploadArea } from './FileUploadArea';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { UploadMessage } from './UploadMessage';
import { UploadActions } from './components/UploadActions';
import { UploadHeader } from './components/UploadHeader';
import { Card, CardContent } from '@/components/ui/card';
import { UploadMVProgress } from './components/UploadMVProgress';
import { UploadTips } from './components/UploadTips';
import { UploadExpectedColumns } from './components/UploadExpectedColumns';

interface UploadSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  files: File[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
  uploading: boolean;
  progress: number;
  progressLabel?: string;
  message: string;
  disabled?: boolean;
  variant?: 'default' | 'marketing' | 'valores';
  dataAttribute?: string;
  maxFiles?: number;
  gradientFrom?: string; // Mantido para compatibilidade, mas não usado
  gradientTo?: string; // Mantido para compatibilidade, mas não usado
  tips?: Array<{ icon?: string; text: string }>;
  expectedColumns?: string[];
  // New props for MV refresh progress
  isRefreshingMVs?: boolean;
  mvRefreshProgress?: number;
  mvRefreshStatus?: string;
}

export const UploadSection = memo(function UploadSection({
  title,
  description,
  icon,
  files,
  onFileChange,
  onRemoveFile,
  onUpload,
  uploading,
  progress,
  progressLabel,
  message,
  disabled = false,
  variant = 'default',
  dataAttribute,
  maxFiles,
  tips,
  expectedColumns,
  isRefreshingMVs,
  mvRefreshProgress,
  mvRefreshStatus,
}: UploadSectionProps) {

  // Ultra-clean variants: minimal borders, no heavy shadows
  const borderColor = variant === 'marketing' ? 'border-purple-100 dark:border-purple-900/30' :
    variant === 'valores' ? 'border-emerald-100 dark:border-emerald-900/30' :
      'border-slate-200 dark:border-slate-800';

  // Subtle accents for the top line
  const accentColor = variant === 'marketing' ? 'bg-purple-500' :
    variant === 'valores' ? 'bg-emerald-500' :
      'bg-blue-500';

  return (
    <Card className={`group relative h-full flex flex-col overflow-hidden rounded-2xl border ${borderColor} bg-white shadow-sm transition-all duration-500 hover:shadow-md hover:translate-y-[-2px] dark:bg-slate-950`}>
      {/* Top Accent Line - thinner and cleaner */}
      <div className={`absolute top-0 left-0 w-full h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${accentColor}`} />

      <div className="pt-8 px-8">
        <UploadHeader title={title} description={description} icon={icon} />
      </div>

      <CardContent className="flex-1 flex flex-col gap-8 p-8 pt-4">
        {/* Área de Upload */}
        <div className="flex-1 min-h-[180px] flex flex-col justify-center">
          <FileUploadArea
            files={files}
            onFileChange={onFileChange}
            disabled={uploading || disabled}
            variant={variant}
            dataAttribute={dataAttribute}
            maxFiles={maxFiles}
          />
        </div>

        <div className="space-y-6">
          {/* Lista de Arquivos */}
          <FileList
            files={files}
            onRemove={onRemoveFile}
            disabled={uploading}
            variant={variant}
          />

          {/* Mensagem de Status */}
          <UploadMessage
            message={message}
            variant={variant}
          />

          {/* Configuração de MV */}
          <UploadMVProgress
            isRefreshingMVs={isRefreshingMVs}
            mvRefreshProgress={mvRefreshProgress}
            mvRefreshStatus={mvRefreshStatus}
          />

          {/* Barra de Progresso */}
          <UploadProgress
            progress={progress}
            progressLabel={progressLabel}
            variant={variant}
          />
        </div>

        <div className="mt-auto space-y-6">
          {/* Botão de Upload */}
          <UploadActions
            onUpload={onUpload}
            uploading={uploading}
            hasFiles={files.length > 0}
            variant={variant}
            fileCount={files.length}
          />

          {/* Informações e Dicas - Less intrusive */}
          <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
            <UploadTips tips={tips} />
            <UploadExpectedColumns columns={expectedColumns} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
