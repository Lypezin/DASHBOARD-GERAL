/**
 * Componente para gerenciar refresh de Materialized Views
 */

import { RefreshCw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useUploadRefresh } from '@/hooks/data/useUploadRefresh';

interface UploadRefreshMVsProps {
  onAutoRefresh?: () => void;
}

export function UploadRefreshMVs({ onAutoRefresh }: UploadRefreshMVsProps) {
  const {
    refreshing, message, progress, progressLabel, total, completed, failedMVs,
    refreshAllMVs, retryFailedMVs,
  } = useUploadRefresh();

  const isSuccess = message?.includes('✅');
  const isError = message?.includes('❌');

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <RefreshCw className={`h-4.5 w-4.5 text-amber-600 dark:text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Sincronizar Dados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualize as visualizações após novos uploads.
              </p>
            </div>
          </div>

          {/* Progress */}
          {refreshing && (
            <div className="space-y-2 pl-[52px]">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                <div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${Math.max(5, progress)}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Processando...</span>
                <span className="tabular-nums">{Math.round(progress)}% ({completed}/{total})</span>
              </div>
            </div>
          )}

          {/* Message */}
          {!refreshing && message && (
            <div className="pl-[52px]">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : isError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                {isSuccess && <CheckCircle2 className="h-3.5 w-3.5" />}
                {isError && <AlertTriangle className="h-3.5 w-3.5" />}
                <span>{message.replace(/[✅❌]/g, '').trim()}</span>
              </div>
            </div>
          )}

          {/* Retry */}
          {failedMVs.length > 0 && !refreshing && (
            <div className="pl-[52px]">
              <button onClick={retryFailedMVs} className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                Tentar novamente ({failedMVs.length} erro{failedMVs.length > 1 ? 's' : ''})
              </button>
            </div>
          )}
        </div>

        <button
          onClick={refreshAllMVs}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
