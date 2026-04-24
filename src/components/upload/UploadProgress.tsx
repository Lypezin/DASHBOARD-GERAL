/**
 * Componente genérico para barra de progresso de upload
 */

interface UploadProgressProps {
  progress: number;
  progressLabel?: string;
  variant?: 'default' | 'marketing' | 'valores';
}

const variantStyles = {
  default: {
    bar: 'bg-blue-500',
    track: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
  },
  marketing: {
    bar: 'bg-purple-500',
    track: 'bg-purple-100 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
  },
  valores: {
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function UploadProgress({ progress, progressLabel, variant = 'default' }: UploadProgressProps) {
  const styles = variantStyles[variant];

  if (!progressLabel && progress === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 animate-in fade-in duration-300">
      <div className={`overflow-hidden rounded-full ${styles.track} h-2`}>
        <div
          className={`h-full rounded-full ${styles.bar} transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between">
        {progressLabel && (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{progressLabel}</p>
        )}
        <p className={`text-xs font-semibold ${styles.text} tabular-nums ml-auto`}>{progress.toFixed(0)}%</p>
      </div>
    </div>
  );
}
