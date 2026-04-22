import { memo } from 'react';
import { FileUploadArea } from './FileUploadArea';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { UploadMessage } from './UploadMessage';
import { UploadHeader } from './components/UploadHeader';
import { Card, CardContent } from '@/components/ui/card';
import { UploadMVProgress } from './components/UploadMVProgress';
import { UploadSectionFooter } from './UploadSectionFooter';
import { UploadSectionProps } from './types';

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
          <FileList files={files} onRemove={onRemoveFile} disabled={uploading || disabled} variant={variant} />
          <UploadMessage message={message} variant={variant} />
          <UploadMVProgress isRefreshingMVs={isRefreshingMVs} mvRefreshProgress={mvRefreshProgress} mvRefreshStatus={mvRefreshStatus} />
          <UploadProgress progress={progress} progressLabel={progressLabel} variant={variant} />
        </div>

        <UploadSectionFooter 
          onUpload={onUpload}
          uploading={uploading}
          fileCount={files.length}
          disabled={disabled}
          variant={variant}
          tips={tips}
          expectedColumns={expectedColumns}
        />
      </CardContent>
    </Card>
  );
});
