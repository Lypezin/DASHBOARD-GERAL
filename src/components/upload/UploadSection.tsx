import { memo } from 'react';
import { FileUploadArea } from './FileUploadArea';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { UploadMessage } from './UploadMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileSpreadsheet, Upload, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        {isRefreshingMVs && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
              <span>Atualizando visualizações...</span>
              <span>{Math.round(mvRefreshProgress || 0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/30">
              <div
                className="h-full bg-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${mvRefreshProgress || 0}%` }}
              />
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 text-center animate-pulse">
              {mvRefreshStatus}
            </p>
          </div>
        )}

        {/* Mensagem de Status */}
        <UploadMessage
          message={message}
          variant={variant}
        />

        {/* Informações e Dicas */}
        {tips && tips.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <ul className="flex-1 space-y-1 text-xs text-muted-foreground">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-1">
                    {tip.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Colunas Esperadas */}
        {expectedColumns && expectedColumns.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              Ver colunas esperadas
            </summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {expectedColumns.map((col) => (
                <Badge key={col} variant="secondary" className="text-[10px] font-mono">
                  {col}
                </Badge>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
});
