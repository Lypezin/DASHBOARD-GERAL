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

  const borderColor = variant === 'marketing' ? 'border-purple-200 dark:border-purple-800' :
    variant === 'valores' ? 'border-emerald-200 dark:border-emerald-800' :
      'border-blue-200 dark:border-blue-800';

  const shadowColor = variant === 'marketing' ? 'shadow-purple-500/10' :
    variant === 'valores' ? 'shadow-emerald-500/10' :
      'shadow-blue-500/10';

  return (
    <Card className={`h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl ${borderColor} ${shadowColor} backdrop-blur-sm bg-white/50 dark:bg-slate-900/50`}>
      <div className="relative">
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${variant === 'marketing' ? 'from-purple-400 to-pink-400' :
            variant === 'valores' ? 'from-emerald-400 to-teal-400' :
              'from-blue-400 to-indigo-400'
          }`} />

        <UploadHeader title={title} description={description} icon={icon} />
      </div>

      <CardContent className="flex-1 flex flex-col gap-6 pt-6">
        {/* Área de Upload */}
        <div className="flex-1 min-h-[200px] flex flex-col justify-center">
          <FileUploadArea
            files={files}
            onFileChange={onFileChange}
            disabled={uploading || disabled}
            variant={variant}
            dataAttribute={dataAttribute}
            maxFiles={maxFiles}
          />
        </div>

        <div className="space-y-4">
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

          {/* Barra de Progresso - Atualização de MVs */}
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

        <div className="mt-auto space-y-4">
          {/* Botão de Upload */}
          <UploadActions
            onUpload={onUpload}
            uploading={uploading}
            hasFiles={files.length > 0}
            variant={variant}
            fileCount={files.length}
          />

          {/* Informações e Dicas */}
          <div className="grid grid-cols-1 gap-2">
            <UploadTips tips={tips} />
            <UploadExpectedColumns columns={expectedColumns} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
