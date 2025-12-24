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
  return (
    <Card className="h-full flex flex-col">
      <UploadHeader title={title} description={description} icon={icon} />

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Área de Upload */}
        <FileUploadArea
          files={files}
          onFileChange={onFileChange}
          disabled={uploading || disabled}
          variant={variant}
          dataAttribute={dataAttribute}
          maxFiles={maxFiles}
        />

        {/* Lista de Arquivos */}
        <FileList
          files={files}
          onRemove={onRemoveFile}
          disabled={uploading}
          variant={variant}
        />

        {/* Botão de Upload */}
        {/* Botão de Upload */}
        <UploadActions
          onUpload={onUpload}
          uploading={uploading}
          hasFiles={files.length > 0}
          variant={variant}
          fileCount={files.length}
        />

        {/* Barra de Progresso */}
        <UploadProgress
          progress={progress}
          progressLabel={progressLabel}
          variant={variant}
        />

        {/* Barra de Progresso - Atualização de MVs */}
        <UploadMVProgress
          isRefreshingMVs={isRefreshingMVs}
          mvRefreshProgress={mvRefreshProgress}
          mvRefreshStatus={mvRefreshStatus}
        />

        {/* Mensagem de Status */}
        <UploadMessage
          message={message}
          variant={variant}
        />

        {/* Informações e Dicas */}
        <UploadTips tips={tips} />

        {/* Colunas Esperadas */}
        <UploadExpectedColumns columns={expectedColumns} />
      </CardContent>
    </Card>
  );
});
