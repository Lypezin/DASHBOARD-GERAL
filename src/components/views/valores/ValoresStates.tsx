
import React from 'react';
import { AlertCircle, DollarSign } from 'lucide-react';

export const ValoresError = ({ error }: { error: string }) => (
    <div className="flex h-[60vh] items-center justify-center px-4 animate-fade-in">
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-rose-200/80 bg-white/90 p-7 text-center shadow-[0_30px_80px_-50px_rgba(244,63,94,0.45)] backdrop-blur dark:border-rose-900/50 dark:bg-slate-900/90 dark:shadow-black/30 sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 text-white shadow-lg shadow-rose-500/20">
                <AlertCircle className="h-8 w-8" />
            </div>
            <p className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Erro ao carregar valores</p>
            <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-md transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
                Tentar novamente
            </button>
        </div>
    </div>
);

export const ValoresEmpty = () => (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300/80 bg-white/75 px-6 py-14 text-center shadow-sm animate-fade-in dark:border-slate-700/80 dark:bg-slate-900/45">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <DollarSign className="h-8 w-8" />
        </div>
        <p className="mt-5 text-xl font-black text-slate-950 dark:text-white">Nenhum valor encontrado</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">Tente ajustar os filtros para reduzir o recorte ou ampliar o periodo analisado.</p>
    </div>
);
