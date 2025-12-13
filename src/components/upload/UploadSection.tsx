import { memo } from 'react';
import { FileUploadArea } from './FileUploadArea';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { UploadMessage } from './UploadMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

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
        <Button
          onClick={onUpload}
          disabled={uploading || files.length === 0}
          className="w-full"
          variant={variant === 'marketing' ? 'default' : variant === 'valores' ? 'default' : 'default'}
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Processando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Enviar {files.length > 0 ? `${files.length} Arquivo(s)` : 'Arquivo'}</span>
            </div>
          )}
        </Button>

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
