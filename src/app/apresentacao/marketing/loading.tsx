import { Loader2 } from 'lucide-react';

export default function MarketingPresentationLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-center text-slate-700 dark:bg-slate-950 dark:text-slate-200"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <Loader2 className="mx-auto h-9 w-9 motion-safe:animate-spin text-blue-600 dark:text-sky-300" aria-hidden="true" />
        <h1 className="mt-5 text-lg font-semibold">Preparando apresentação de marketing</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Carregando indicadores por cidade, evolução diária e comparativo de custos.
        </p>
        <div aria-hidden="true" className="relative mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
          <span className="dashboard-loading-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-cyan-400" />
        </div>
      </div>
    </main>
  );
}
