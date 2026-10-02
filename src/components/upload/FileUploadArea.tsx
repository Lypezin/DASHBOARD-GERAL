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
    text: 'text-primary',
    bg: 'bg-accent',
    border: 'border-border',
    ring: 'peer-focus:ring-ring/20',
    hoverBorder: 'group-hover:border-primary/50',
    iconBg: 'bg-accent',
  },
  marketing: {
    text: 'text-primary',
    bg: 'bg-accent',
    border: 'border-border',
    ring: 'peer-focus:ring-ring/20',
    hoverBorder: 'group-hover:border-primary/50',
    iconBg: 'bg-accent',
  },
  valores: {
    text: 'text-primary',
    bg: 'bg-accent',
    border: 'border-border',
    ring: 'peer-focus:ring-ring/20',
    hoverBorder: 'group-hover:border-primary/50',
    iconBg: 'bg-accent',
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

      <div className={`flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-6 text-center transition-colors duration-200 ${v.hoverBorder} peer-focus:ring-2 peer-focus:ring-offset-2 ${v.ring}`}>
        {files.length === 0 ? (
          <div className="space-y-3 transition-transform duration-300 group-hover:scale-[1.01]">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${v.iconBg} transition-colors`}>
              <CloudUpload className={`h-5 w-5 ${v.text} transition-transform duration-300 group-hover:-translate-y-0.5`} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Arraste a planilha para cá ou selecione o arquivo</p>
              <p className="text-[11px] text-muted-foreground">
                Formatos aceitos: {accept.replace(/\./g, '').replace(/,\s*/g, ', ').toUpperCase()}
                {maxFiles ? ` • Máx. ${maxFiles} arquivo(s)` : ''}
              </p>
            </div>

            {(variant === 'marketing' || variant === 'valores') && (
              <div className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
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
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {(totalSize / 1024 / 1024).toFixed(2)} MB no total
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
