import React from 'react';

interface Props {
    error: string;
}

export const ResultadosErrorState: React.FC<Props> = ({ error }) => {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="mx-auto max-w-md rounded-[1.8rem] border border-rose-200/80 bg-white/96 p-6 text-center shadow-[0_20px_52px_-38px_rgba(190,24,93,0.3)] dark:border-rose-900/40 dark:bg-slate-950/82">
                <div className="mb-4 text-4xl">!</div>
                <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-xl"
                >
                    Tentar novamente
                </button>
            </div>
        </div>
    );
};
