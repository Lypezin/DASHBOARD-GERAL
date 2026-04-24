import { memo } from 'react';
import { FileUploadArea } from './FileUploadArea';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { UploadMessage } from './UploadMessage';
import { UploadHeader } from './components/UploadHeader';
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

  const accentColor = variant === 'marketing' ? 'bg-purple-500' :
    variant === 'valores' ? 'bg-emerald-500' :
      'bg-blue-500';

  return (
    <div className="group relative h-full flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] ${accentColor} opacity-30 transition-opacity duration-300 group-hover:opacity-80`} />

      {/* Header */}
      <div className="pt-7 px-7">
        <UploadHeader title={title} description={description} icon={icon} variant={variant} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-6 p-7 pt-4">
        {/* Upload Area */}
        <div className="flex-1 min-h-[160px] flex flex-col justify-center">
          <FileUploadArea
            files={files}
            onFileChange={onFileChange}
            disabled={uploading || disabled}
            variant={variant}
            dataAttribute={dataAttribute}
            maxFiles={maxFiles}
          />
        </div>

        {/* Status Area */}
        <div className="space-y-4">
          <FileList files={files} onRemove={onRemoveFile} disabled={uploading || disabled} variant={variant} />
          <UploadMessage message={message} variant={variant} />
          <UploadMVProgress isRefreshingMVs={isRefreshingMVs} mvRefreshProgress={mvRefreshProgress} mvRefreshStatus={mvRefreshStatus} />
          <UploadProgress progress={progress} progressLabel={progressLabel} variant={variant} />
        </div>

        {/* Footer */}
        <UploadSectionFooter 
          onUpload={onUpload}
          uploading={uploading}
          fileCount={files.length}
          disabled={disabled}
          variant={variant}
          tips={tips}
          expectedColumns={expectedColumns}
        />
      </div>
    </div>
  );
});
