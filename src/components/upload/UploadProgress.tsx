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
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
  },
  marketing: {
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
  },
  valores: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
};

export function UploadProgress({ progress, progressLabel, variant = 'default' }: UploadProgressProps) {
  const styles = variantStyles[variant];

  if (!progressLabel && progress === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3 animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${styles.gradient} shadow-lg transition-all duration-500`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {progressLabel && (
        <div className="text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-300">{progressLabel}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{progress.toFixed(1)}% concluído</p>
        </div>
      )}
    </div>
  );
}

