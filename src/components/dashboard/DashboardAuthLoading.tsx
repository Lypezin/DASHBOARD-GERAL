import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const DashboardAuthLoading = React.memo(function DashboardAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 text-center shadow-[0_28px_80px_-44px_rgba(15,23,42,0.7)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/85 dark:shadow-black/40">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white shadow-lg shadow-blue-600/20">
          <span className="absolute inset-0 rounded-3xl bg-white/20 animate-ping" />
          <ShieldCheck className="relative h-8 w-8" />
        </div>
        <div className="mx-auto mt-6 h-2 w-44 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
          <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-blue-600 dark:bg-blue-400" />
        </div>
        <p className="mt-5 text-xl font-black tracking-tight text-slate-900 dark:text-white">Verificando autenticação</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Validando sua sessão e preparando o acesso ao dashboard.
        </p>
      </div>
    </div>
  );
});

DashboardAuthLoading.displayName = 'DashboardAuthLoading';
