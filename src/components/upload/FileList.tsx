/**
 * Componente genérico para listar arquivos selecionados
 * Mostra dados detalhados de cada arquivo
 */

import { FileSpreadsheet, X, Clock, HardDrive } from 'lucide-react';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
  variant?: 'default' | 'marketing' | 'valores';
}

const variantStyles = {
  default: {
    accent: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-slate-150 dark:border-slate-800',
  },
  marketing: {
    accent: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-slate-150 dark:border-slate-800',
  },
  valores: {
    accent: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-slate-150 dark:border-slate-800',
  },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(date: number): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? `.${parts.pop()!.toUpperCase()}` : '';
}

export function FileList({ files, onRemove, disabled = false, variant = 'default' }: FileListProps) {
  const styles = variantStyles[variant];

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5 mb-1">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Arquivos selecionados
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {files.length} arquivo{files.length > 1 ? 's' : ''}
        </span>
      </div>
      {files.map((file, index) => (
        <div
          key={index}
          className={`group/item flex items-center gap-3 rounded-xl border ${styles.border} bg-white p-3 transition-all duration-200 hover:bg-slate-50/80 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-200`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* File Icon */}
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
            <FileSpreadsheet className={`h-4.5 w-4.5 ${styles.accent}`} />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(file.size)}
              </span>
              {file.lastModified && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(file.lastModified)}
                </span>
              )}
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {getFileExtension(file.name)}
              </span>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 disabled:opacity-40 disabled:pointer-events-none opacity-0 group-hover/item:opacity-100"
            title="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
