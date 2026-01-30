/**
 * Componente para gerenciar refresh de Materialized Views
 */

import { useUploadRefresh } from '@/hooks/data/useUploadRefresh';

interface UploadRefreshMVsProps {
  onAutoRefresh?: () => void;
}

export function UploadRefreshMVs({ onAutoRefresh }: UploadRefreshMVsProps) {
  const {
    refreshing,
    message,
    progress,
    progressLabel,
    total,
    completed,
    failedMVs,
    refreshAllMVs,
    retryFailedMVs,
  } = useUploadRefresh();

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 p-1 shadow-lg dark:border-amber-800/50 dark:from-amber-950/30 dark:to-orange-950/20 max-w-4xl mx-auto">
      <div className="rounded-xl bg-white/60 p-6 backdrop-blur-sm dark:bg-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-900/50 dark:text-amber-400">
                <span className="text-xl">🔄</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Sincronizar Dados
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Atualize as visualizações para refletir os novos uploads no dashboard.
                </p>
              </div>
            </div>

            {/* Status e Progresso */}
            <div className="pl-13">
              {refreshing ? (
                <div className="space-y-3">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                    <div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${Math.max(5, progress)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Processando...</span>
                    <span>{Math.round(progress)}% ({completed} de {total})</span>
                  </div>
                </div>
              ) : message ? (
                <div className={`text-sm font-medium ${message.includes('✅') ? 'text-emerald-600 dark:text-emerald-400' :
                  message.includes('❌') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'
                  }`}>
                  {message}
                </div>
              ) : null}
            </div>

            {failedMVs.length > 0 && !refreshing && (
              <button onClick={retryFailedMVs} className="text-sm font-semibold text-rose-600 hover:text-rose-700 underline dark:text-rose-400">
                Tentar novamente ({failedMVs.length} erros)
              </button>
            )}
          </div>

          <button
            onClick={refreshAllMVs}
            disabled={refreshing}
            className={`
                relative px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0
                ${refreshing ? 'cursor-not-allowed opacity-80' : 'hover:shadow-amber-500/25'}
                bg-gradient-to-r from-amber-500 to-orange-600
            `}
          >
            {refreshing ? (
              <span className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                Atualizando...
              </span>
            ) : (
              <span className="flex items-center gap-2 text-lg">
                Atualizar Agora
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

