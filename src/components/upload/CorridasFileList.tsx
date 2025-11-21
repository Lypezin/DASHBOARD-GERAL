/**
 * Componente de lista de arquivos para upload de corridas
 */

interface CorridasFileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  uploading: boolean;
}

export function CorridasFileList({ files, onRemoveFile, uploading }: CorridasFileListProps) {
  if (files.length === 0 || uploading) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30"
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
            onClick={() => onRemoveFile(index)}
            className="rounded-lg bg-rose-100 p-2 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
          >
            <span>🗑️</span>
          </button>
        </div>
      ))}
    </div>
  );
}

