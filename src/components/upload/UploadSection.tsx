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

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">

      {/* Header */}
      <div className="relative border-b border-border px-5 py-4 sm:px-6">
        <UploadHeader title={title} description={description} icon={icon} variant={variant} />
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col gap-4 p-4 sm:p-5">
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
