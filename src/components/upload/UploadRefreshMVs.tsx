/**
 * Componente para gerenciar refresh de Materialized Views
 */

import { useUploadRefresh } from '@/hooks/useUploadRefresh';

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
    <div className="mt-8 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 dark:border-amber-800 dark:from-amber-950/30 dark:to-yellow-950/30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
            🔄 Atualizar Materialized Views
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Após fazer upload de novos dados, clique aqui para atualizar todas as Materialized Views e garantir que os dados estejam atualizados no dashboard.
          </p>

          {/* Barra de Progresso */}
          {refreshing && (
            <div className="mt-4 space-y-2">
              {total > 0 ? (
                <>
                  <div className="overflow-hidden rounded-full bg-amber-200 shadow-inner dark:bg-amber-900">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 shadow-lg transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      {progressLabel || `${completed}/${total} atualizadas`}
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {Math.max(0, Math.min(100, progress)).toFixed(1)}% concluído
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                  <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                    Preparando atualização...
                  </p>
                </div>
              )}
            </div>
          )}

          {message && (
            <div
              className={`mt-3 rounded-lg p-3 text-sm ${
                message.includes('✅')
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : message.includes('❌')
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                  : message.includes('ℹ️')
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Botão para tentar novamente as que falharam */}
          {failedMVs.length > 0 && !refreshing && (
            <div className="mt-3">
              <button
                onClick={retryFailedMVs}
                className="w-full transform rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                🔄 Tentar Novamente ({failedMVs.length} que falharam)
              </button>
            </div>
          )}
        </div>
        <button
          onClick={refreshAllMVs}
          disabled={refreshing}
          className="flex-shrink-0 transform rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
        >
          {refreshing ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Atualizando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <span>Atualizar</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

