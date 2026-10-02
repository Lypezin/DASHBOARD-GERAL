import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface DashboardErrorStateProps {
  error: string;
}

export const DashboardErrorState = React.memo(function DashboardErrorState({
  error,
}: DashboardErrorStateProps) {
  return (
    <div className="flex h-[60vh] items-center justify-center px-4 sm:h-[70vh] motion-safe:animate-fade-in">
      <div className="w-full max-w-xl rounded-xl border border-rose-200 bg-card p-7 text-center shadow-sm dark:border-rose-900/50 sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Erro ao carregar dados
        </p>
        <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200 sm:text-base">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
});

DashboardErrorState.displayName = 'DashboardErrorState';
