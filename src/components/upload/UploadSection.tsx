/**
 * Componente completo de seção de upload
 * Agrupa todos os componentes de upload em uma seção reutilizável
 */

import { FileUploadArea } from './FileUploadArea';
import { FileList } from './FileList';
import { UploadProgress } from './UploadProgress';
import { UploadMessage } from './UploadMessage';

interface UploadSectionProps {
  title: string;
  description: string;
  icon: string;
  files: File[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
  uploading: boolean;
  progress: number;
  progressLabel?: string;
  message: string;
  disabled?: boolean;
  variant?: 'default' | 'marketing' | 'valores';
  dataAttribute?: string;
  maxFiles?: number;
  gradientFrom: string;
  gradientTo: string;
  tips?: Array<{ icon?: string; text: string }>;
  expectedColumns?: string[];
}

export function UploadSection({
  title,
  description,
  icon,
  files,
  onFileChange,
  onRemoveFile,
  onUpload,
  uploading,
  progress,
  progressLabel,
  message,
  disabled = false,
  variant = 'default',
  dataAttribute,
  maxFiles,
  gradientFrom,
  gradientTo,
  tips,
  expectedColumns,
}: UploadSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-slate-900 h-full flex flex-col" style={{
      borderColor: variant === 'marketing' ? 'rgb(196 181 253)' : variant === 'valores' ? 'rgb(110 231 183)' : 'rgb(191 219 254)',
    }}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-5 text-center`}>
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <span className="text-2xl">{icon}</span>
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>

      {/* Conteúdo */}
      <div className="p-5 space-y-3 flex-1 flex flex-col overflow-auto">
        {/* Área de Upload */}
        <FileUploadArea
          files={files}
          onFileChange={onFileChange}
          disabled={uploading || disabled}
          variant={variant}
          dataAttribute={dataAttribute}
          maxFiles={maxFiles}
        />

        {/* Lista de Arquivos */}
        <FileList
          files={files}
          onRemove={onRemoveFile}
          disabled={uploading}
          variant={variant}
        />

        {/* Botão de Upload */}
        <button
          onClick={onUpload}
          disabled={uploading || files.length === 0}
          className={`w-full transform rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} py-2.5 font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none text-sm`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Processando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-base">🚀</span>
              <span>Enviar {files.length} Arquivo(s)</span>
            </div>
          )}
        </button>

        {/* Barra de Progresso */}
        <UploadProgress
          progress={progress}
          progressLabel={progressLabel}
          variant={variant}
        />

        {/* Mensagem de Status */}
        <UploadMessage
          message={message}
          variant={variant}
        />

        {/* Informações e Dicas */}
        {tips && tips.length > 0 && (
          <div className={`rounded-lg p-3 ${variant === 'marketing' ? 'bg-purple-50 dark:bg-purple-950/30' : variant === 'valores' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
            <div className="flex items-start gap-2">
              <span className="text-base">💡</span>
              <ul className={`flex-1 space-y-1 text-xs ${variant === 'marketing' ? 'text-purple-800 dark:text-purple-200' : variant === 'valores' ? 'text-emerald-800 dark:text-emerald-200' : 'text-blue-800 dark:text-blue-200'}`}>
                {tips.map((tip, index) => (
                  <li key={index}>
                    {tip.icon || '•'} {tip.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Colunas Esperadas */}
        {expectedColumns && expectedColumns.length > 0 && (
          <details className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
            <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              📋 Ver colunas esperadas
            </summary>
            <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
              {expectedColumns.map((col) => (
                <div key={col} className="flex items-center gap-1.5 rounded bg-white px-2 py-1 dark:bg-slate-900">
                  <span className="text-blue-600">✓</span>
                  <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

