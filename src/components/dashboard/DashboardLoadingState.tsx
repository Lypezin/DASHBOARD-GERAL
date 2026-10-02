import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { DashboardSkeleton } from './DashboardSkeleton';

export const DashboardLoadingState = React.memo(function DashboardLoadingState() {
  return (
    <div className="space-y-4 motion-safe:animate-fade-in">
      <div className="rounded-3xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.6)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />
          </span>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">Atualizando painel</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Carregando filtros, visões e indicadores do dashboard.
            </p>
          </div>
        </div>
      </div>

      <DashboardSkeleton />
    </div>
  );
});

DashboardLoadingState.displayName = 'DashboardLoadingState';

