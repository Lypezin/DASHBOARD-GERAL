
import React from 'react';
import { AlertCircle, DollarSign } from 'lucide-react';

export const ValoresError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex h-[60vh] items-center justify-center px-4">
        <div className="mx-auto w-full max-w-xl rounded-xl border border-rose-200 bg-white p-6 text-center shadow-[0_12px_36px_-28px_rgba(136,38,47,0.32)] dark:border-rose-900/50 dark:bg-slate-900 sm:p-8">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Não foi possível carregar os valores</h1>
            <p className="mt-2 rounded-lg bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#174d70] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#103d5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 focus-visible:ring-offset-2 dark:bg-sky-800 dark:hover:bg-sky-700"
            >
                Tentar novamente
            </button>
        </div>
    </div>
);

export const ValoresEmpty = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c9d9e2] bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/45">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf4f9] text-[#347ca3] dark:bg-sky-950/50 dark:text-sky-200">
            <DollarSign className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-800 dark:text-white">Nenhum valor encontrado</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">Tente ajustar os filtros ou ampliar o período analisado.</p>
    </div>
);
