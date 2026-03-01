/**
 * Componente genérico para área de upload de arquivos
 * Reutilizável para diferentes tipos de upload
 */

import { UPLOAD_STYLES } from './fileUploadStyles';

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

export function FileUploadArea({
  files, onFileChange, disabled = false, accept = '.xlsx, .xls', multiple = true,
  dataAttribute, variant = 'default', maxFiles,
}: FileUploadAreaProps) {
  const v = UPLOAD_STYLES[variant];

  return (
    <div className="relative group w-full h-full min-h-[180px]">
      <input type="file" accept={accept} multiple={multiple} onChange={onFileChange} disabled={disabled} data-attribute={dataAttribute} className="peer absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />

      <div className={`flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-8 text-center transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-900/20 ${v.hoverBgClean} ${v.borderColorClean} peer-focus:ring-1 peer-focus:ring-offset-1 peer-focus:ring-slate-300`}>
        {files.length === 0 ? (
          <div className="space-y-4 group-hover:scale-[1.02] transition-transform duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800"><span className="text-3xl opacity-80 group-hover:opacity-100 transition-opacity">☁️</span></div>
            <div className="space-y-1">
              <p className={`text-base font-semibold ${v.activeColor}`}>Clique ou arraste</p>
              <p className="text-xs text-slate-400 max-w-[180px] mx-auto leading-relaxed">Suporta: {accept.replace(/\./g, '').toUpperCase()}{maxFiles ? ` (Máx ${maxFiles})` : ''}</p>
            </div>

            {(variant === 'marketing' || variant === 'valores') && (
              <div className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${variant === 'marketing' ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300'}`}>
                Substituição Total
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700"><span className="text-3xl">📄</span></div>
            <div>
              <p className={`text-lg font-bold ${v.activeColor}`}>{files.length} arquivo(s)</p>
              <p className="text-xs text-slate-400 mt-1">Pronto para envio</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

