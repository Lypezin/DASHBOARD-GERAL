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

  const accentColor = variant === 'marketing' ? 'from-fuchsia-500 via-purple-500 to-indigo-500' :
    variant === 'valores' ? 'from-emerald-500 via-teal-500 to-cyan-500' :
      'from-blue-600 via-sky-500 to-cyan-400';

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.9)] transition-[border-color,box-shadow,transform,background-color] duration-300 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-[0_24px_82px_-54px_rgba(37,99,235,0.9)] dark:border-slate-800/70 dark:bg-slate-950/80 dark:hover:border-blue-900/60">
      <div className={`absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r ${accentColor} opacity-70 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-blue-200/30 blur-3xl transition-opacity duration-300 group-hover:opacity-90 dark:bg-blue-900/20" />

      {/* Header */}
      <div className="relative px-5 pt-6 sm:px-7 sm:pt-7">
        <UploadHeader title={title} description={description} icon={icon} variant={variant} />
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col gap-6 p-5 pt-4 sm:p-7 sm:pt-4">
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
