import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface DashboardErrorStateProps {
  error: string;
}

export const DashboardErrorState = React.memo(function DashboardErrorState({
  error,
}: DashboardErrorStateProps) {
  return (
    <div className="flex h-[60vh] items-center justify-center px-4 sm:h-[70vh] animate-fade-in">
      <div className="w-full max-w-xl rounded-[2rem] border border-rose-200/80 bg-white/90 p-7 text-center shadow-[0_30px_80px_-50px_rgba(244,63,94,0.45)] backdrop-blur dark:border-rose-900/50 dark:bg-slate-900/90 dark:shadow-black/30 sm:p-9">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 text-white shadow-lg shadow-rose-500/20">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
          Erro ao carregar dados
        </p>
        <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200 sm:text-base">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-md transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
});

DashboardErrorState.displayName = 'DashboardErrorState';
