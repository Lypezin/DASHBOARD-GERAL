import React from 'react';

interface Props {
    error: string;
}

export const ResultadosErrorState: React.FC<Props> = ({ error }) => {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                >
                    Tentar novamente
                </button>
            </div>
        </div>
    );
};
