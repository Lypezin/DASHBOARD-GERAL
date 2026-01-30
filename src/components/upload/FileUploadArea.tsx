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

  // Ultra-clean color logic
  const activeColor = variant === 'marketing' ? 'text-purple-600 dark:text-purple-400' :
    variant === 'valores' ? 'text-emerald-600 dark:text-emerald-400' :
      'text-slate-600 dark:text-slate-400';

  const hoverBg = variant === 'marketing' ? 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10' :
    variant === 'valores' ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10' :
      'hover:bg-slate-50/50 dark:hover:bg-slate-900/10';

  const borderColor = variant === 'marketing' ? 'hover:border-purple-200 dark:hover:border-purple-800' :
    variant === 'valores' ? 'hover:border-emerald-200 dark:hover:border-emerald-800' :
      'hover:border-slate-300 dark:hover:border-slate-700';

  return (
    <div className="relative group w-full h-full min-h-[180px]">
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
          flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 
          bg-slate-50/30 p-8 text-center transition-all duration-300 ease-out
          dark:border-slate-800 dark:bg-slate-900/20
          ${hoverBg} ${borderColor}
          peer-focus:ring-1 peer-focus:ring-offset-1 peer-focus:ring-slate-300
        `}
      >
        {files.length === 0 ? (
          <div className="space-y-4 group-hover:scale-[1.02] transition-transform duration-300">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800`}>
              <span className="text-3xl opacity-80 group-hover:opacity-100 transition-opacity">☁️</span>
            </div>
            <div className="space-y-1">
              <p className={`text-base font-semibold ${activeColor}`}>
                Clique ou arraste
              </p>
              <p className="text-xs text-slate-400 max-w-[180px] mx-auto leading-relaxed">
                Suporta: {accept.replace(/\./g, '').toUpperCase()}
                {maxFiles ? ` (Máx ${maxFiles})` : ''}
              </p>
            </div>

            {variant === 'marketing' && (
              <div className="mt-2 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-medium text-purple-700 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-300">
                Substituição Total
              </div>
            )}

            {variant === 'valores' && (
              <div className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300">
                Substituição Total
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
              <span className="text-3xl">📄</span>
            </div>
            <div>
              <p className={`text-lg font-bold ${activeColor}`}>
                {files.length} arquivo(s)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Pronto para envio
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

