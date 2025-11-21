/**
 * Componente de progresso de upload para corridas
 */

interface CorridasUploadProgressProps {
  uploading: boolean;
  progress: number;
  progressLabel: string;
}

export function CorridasUploadProgress({
  uploading,
  progress,
  progressLabel,
}: CorridasUploadProgressProps) {
  if (!uploading) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3 animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {progressLabel && (
        <div className="text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-300">{progressLabel}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {progress.toFixed(1)}% concluído
          </p>
        </div>
      )}
    </div>
  );
}

