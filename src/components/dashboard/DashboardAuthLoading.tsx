import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const DashboardAuthLoading = React.memo(function DashboardAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200/70 bg-white/90 p-8 text-center shadow-[0_28px_70px_-44px_rgba(15,23,42,0.65)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85 dark:shadow-black/30">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white shadow-lg shadow-blue-600/20">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="mx-auto mt-5 h-11 w-11 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600 dark:border-blue-950 dark:border-t-blue-400" />
        <p className="mt-5 text-xl font-black tracking-tight text-slate-900 dark:text-white">Verificando autenticacao</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Validando sua sessao e preparando o acesso ao dashboard.
        </p>
      </div>
    </div>
  );
});

DashboardAuthLoading.displayName = 'DashboardAuthLoading';
