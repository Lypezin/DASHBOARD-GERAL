/**
 * Componente genérico para área de upload de arquivos
 * Reutilizável para diferentes tipos de upload
 */

interface FileUploadAreaProps {
  files: File[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  dataAttribute?: string;
  variant?: 'default' | 'marketing' | 'valores';
  maxFiles?: number;
}

const variantStyles = {
  default: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
    hoverBg: 'hover:from-blue-100 hover:to-indigo-100',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  marketing: {
    border: 'border-purple-300 dark:border-purple-700',
    bg: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
    hoverBg: 'hover:from-purple-100 hover:to-pink-100',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  valores: {
    border: 'border-emerald-300 dark:border-emerald-700',
    bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    hoverBg: 'hover:from-emerald-100 hover:to-teal-100',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
};

export function FileUploadArea({
  files,
  onFileChange,
  disabled = false,
  accept = '.xlsx, .xls',
  multiple = true,
  dataAttribute,
  variant = 'default',
  maxFiles,
}: FileUploadAreaProps) {
  const styles = variantStyles[variant];

  return (
    <div className="relative">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onFileChange}
        disabled={disabled}
        data-attribute={dataAttribute}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <div
        className={`rounded-2xl border-2 border-dashed ${styles.border} bg-gradient-to-br ${styles.bg} p-12 text-center transition-all duration-300 ${styles.hoverBorder} ${styles.hoverBg} peer-disabled:cursor-not-allowed peer-disabled:opacity-50`}
      >
        {files.length === 0 ? (
          <div className="space-y-4">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${styles.iconBg}`}>
              <span className="text-3xl">📁</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Clique para selecionar ou arraste os arquivos aqui
              </p>
              {variant === 'marketing' && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  ⚠️ Atenção: Os dados anteriores serão substituídos
                </p>
              )}
              {maxFiles && (
                <p className="mt-1 text-xs text-slate-400">
                  Máximo de {maxFiles} arquivo(s)
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">Formatos aceitos: {accept}</p>
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

