/**
 * Componente genérico para listar arquivos selecionados
 */

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
  variant?: 'default' | 'marketing' | 'valores';
}

const variantStyles = {
  default: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  marketing: {
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  valores: {
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
};

export function FileList({ files, onRemove, disabled = false, variant = 'default' }: FileListProps) {
  const styles = variantStyles[variant];

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {files.map((file, index) => (
        <div
          key={index}
          className={`flex items-center justify-between rounded-lg border ${styles.border} ${styles.bg} p-3`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="rounded-lg bg-rose-100 p-2 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400 disabled:opacity-50"
          >
            <span>🗑️</span>
          </button>
        </div>
      ))}
    </div>
  );
}

