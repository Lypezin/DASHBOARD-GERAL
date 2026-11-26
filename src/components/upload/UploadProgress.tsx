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
  const clamped = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));

  if (!progressLabel && clamped === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 animate-in fade-in duration-300">
      <div
        role="progressbar"
        aria-label={progressLabel || 'Progresso do envio'}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`overflow-hidden rounded-full ${styles.track} h-2`}
      >
        <div
          className={`h-full rounded-full ${styles.bar} transition-[width] duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between">
        {progressLabel && (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{progressLabel}</p>
        )}
        <p className={`text-xs font-semibold ${styles.text} tabular-nums ml-auto`}>{clamped.toFixed(0)}%</p>
      </div>
    </div>
  );
}
