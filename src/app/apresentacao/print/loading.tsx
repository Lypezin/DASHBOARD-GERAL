import { Loader2 } from 'lucide-react';

export default function OperationalPrintLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-slate-200"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <Loader2 className="mx-auto h-9 w-9 motion-safe:animate-spin text-sky-400" aria-hidden="true" />
        <h1 className="mt-5 text-lg font-semibold text-white">Preparando relatório operacional</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Reunindo os comparativos semanais e slides para exibição e impressão.
        </p>
        <div aria-hidden="true" className="relative mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-slate-800">
          <span className="dashboard-loading-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300" />
        </div>
      </div>
    </main>
  );
}
