/**
 * Componente genérico para área de upload de arquivos
 * Reutilizável para diferentes tipos de upload
 */

import { CloudUpload, FileCheck2 } from 'lucide-react';

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

const variantAccent = {
  default: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/40',
    ring: 'peer-focus:ring-blue-200 dark:peer-focus:ring-blue-800/40',
    hoverBorder: 'group-hover:border-blue-300 dark:group-hover:border-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  marketing: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/40',
    ring: 'peer-focus:ring-purple-200 dark:peer-focus:ring-purple-800/40',
    hoverBorder: 'group-hover:border-purple-300 dark:group-hover:border-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  valores: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    ring: 'peer-focus:ring-emerald-200 dark:peer-focus:ring-emerald-800/40',
    hoverBorder: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
};

export function FileUploadArea({
  files, onFileChange, disabled = false, accept = '.xlsx, .xls', multiple = true,
  dataAttribute, variant = 'default', maxFiles,
}: FileUploadAreaProps) {
  const v = variantAccent[variant];

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="relative group w-full h-full min-h-[160px]">
      <input type="file" accept={accept} multiple={multiple} onChange={onFileChange} disabled={disabled} data-attribute={dataAttribute} className="peer absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />

      <div className={`flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-900/20 ${v.hoverBorder} peer-focus:ring-2 peer-focus:ring-offset-2 ${v.ring}`}>
        {files.length === 0 ? (
          <div className="space-y-3 transition-transform duration-300 group-hover:scale-[1.01]">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${v.iconBg} transition-colors`}>
              <CloudUpload className={`h-5 w-5 ${v.text} transition-transform duration-300 group-hover:-translate-y-0.5`} />
            </div>
            <div className="space-y-1">
              <p className={`text-sm font-semibold ${v.text}`}>Arraste arquivos ou clique para selecionar</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {accept.replace(/\./g, '').replace(/,\s*/g, ', ').toUpperCase()}
                {maxFiles ? ` • Máx. ${maxFiles} arquivo(s)` : ''}
              </p>
            </div>

            {(variant === 'marketing' || variant === 'valores') && (
              <div className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${variant === 'marketing' ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-300' : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300'}`}>
                Modo Substituição
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${v.iconBg}`}>
              <FileCheck2 className={`h-5 w-5 ${v.text}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${v.text}`}>{files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {(totalSize / 1024 / 1024).toFixed(2)} MB no total
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
