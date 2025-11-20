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
    <div className="overflow-hidden rounded-3xl border bg-white shadow-2xl dark:bg-slate-900 h-full" style={{
      borderColor: variant === 'marketing' ? 'rgb(196 181 253)' : variant === 'valores' ? 'rgb(110 231 183)' : 'rgb(191 219 254)',
    }}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-8 text-center`}>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <span className="text-4xl">{icon}</span>
        </div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-white/90">{description}</p>
      </div>

      {/* Conteúdo */}
      <div className="p-8">
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
          className={`mt-6 w-full transform rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Processando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">🚀</span>
              <span>Enviar {files.length} Arquivo(s) {variant === 'marketing' ? 'Marketing' : variant === 'valores' ? 'Valores por Cidade' : ''}</span>
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
          <div className={`mt-8 rounded-xl p-6 ${variant === 'marketing' ? 'bg-purple-50 dark:bg-purple-950/30' : variant === 'valores' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className={`font-bold ${variant === 'marketing' ? 'text-purple-900 dark:text-purple-100' : variant === 'valores' ? 'text-emerald-900 dark:text-emerald-100' : 'text-blue-900 dark:text-blue-100'}`}>
                  {variant === 'marketing' ? 'Importante sobre Marketing' : variant === 'valores' ? 'Importante sobre Valores por Cidade' : 'Dicas importantes'}
                </h3>
                <ul className={`mt-3 space-y-2 text-sm ${variant === 'marketing' ? 'text-purple-800 dark:text-purple-200' : variant === 'valores' ? 'text-emerald-800 dark:text-emerald-200' : 'text-blue-800 dark:text-blue-200'}`}>
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={`mt-0.5 ${variant === 'marketing' ? 'text-purple-600' : variant === 'valores' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {tip.icon || '•'}
                      </span>
                      <span>{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Colunas Esperadas */}
        {expectedColumns && expectedColumns.length > 0 && (
          <details className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              📋 Ver colunas esperadas na planilha
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {expectedColumns.map((col) => (
                <div key={col} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
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

