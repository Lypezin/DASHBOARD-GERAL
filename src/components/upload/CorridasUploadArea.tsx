/**
 * Componente de área de upload para arquivos de corridas
 */

interface CorridasUploadAreaProps {
  files: File[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export function CorridasUploadArea({ files, onFileChange, uploading }: CorridasUploadAreaProps) {
  return (
    <div className="relative">
      <input
        type="file"
        accept=".xlsx, .xls"
        multiple
        onChange={onFileChange}
        disabled={uploading}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center transition-all duration-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:border-blue-600">
        {files.length === 0 ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span className="text-3xl">📁</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Clique para selecionar ou arraste os arquivos aqui
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Você pode selecionar múltiplos arquivos de uma vez
              </p>
              <p className="mt-1 text-xs text-slate-400">Formatos aceitos: .xlsx, .xls</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {files.length} arquivo(s) selecionado(s)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

