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

  // Determinar cores baseadas na variante para os ícones e textos
  const activeColor = variant === 'marketing' ? 'text-purple-600 dark:text-purple-400' :
    variant === 'valores' ? 'text-emerald-600 dark:text-emerald-400' :
      'text-blue-600 dark:text-blue-400';

  const borderColor = variant === 'marketing' ? 'group-hover:border-purple-400 dark:group-hover:border-purple-400' :
    variant === 'valores' ? 'group-hover:border-emerald-400 dark:group-hover:border-emerald-400' :
      'group-hover:border-blue-400 dark:group-hover:border-blue-400';

  const bgColor = variant === 'marketing' ? 'group-hover:bg-purple-50 dark:group-hover:bg-purple-900/10' :
    variant === 'valores' ? 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10' :
      'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10';

  return (
    <div className="relative group w-full">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onFileChange}
        disabled={disabled}
        data-attribute={dataAttribute}
        className="peer absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />

      <div
        className={`
          relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed 
          p-8 text-center transition-all duration-300 ease-in-out
          ${styles.border} ${styles.bg}
          ${borderColor} ${bgColor}
          peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
          peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-background
          ${variant === 'marketing' ? 'peer-focus:ring-purple-500' : variant === 'valores' ? 'peer-focus:ring-emerald-500' : 'peer-focus:ring-blue-500'}
        `}
      >
        {files.length === 0 ? (
          <div className="space-y-4 transition-transform duration-300 group-hover:-translate-y-1">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-sm transition-shadow duration-300 group-hover:shadow-md ${styles.iconBg}`}>
              <span className="text-4xl drop-shadow-sm">☁️</span>
            </div>
            <div className="space-y-2">
              <p className={`text-lg font-bold transition-colors ${activeColor}`}>
                Procurar Arquivos
              </p>
              <p className="text-sm text-muted-foreground">
                Arraste e solte ou clique para selecionar
              </p>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground/80">
              <span>Formatos: {accept.replace(/\./g, '').toUpperCase()}</span>
              {maxFiles && <span>Máximo: {maxFiles} arquivo(s)</span>}
            </div>

            {variant === 'marketing' && (
              <div className="mt-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 inline-block">
                ⚠️ Substituição Completa
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800">
              <span className="text-4xl">📄</span>
            </div>
            <div>
              <p className={`text-xl font-bold ${activeColor}`}>
                {files.length} arquivo(s)
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                Pronto para envio
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

