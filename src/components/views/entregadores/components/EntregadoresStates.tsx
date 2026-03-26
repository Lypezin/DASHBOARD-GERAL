import React from 'react';

interface EntregadoresErrorStateProps {
    error: string;
    onRetry: () => void;
}

export const EntregadoresErrorState = React.memo(function EntregadoresErrorState({
    error,
    onRetry
}: EntregadoresErrorStateProps) {
    return (
        <div className="flex h-[60vh] items-center justify-center animate-fade-in">
            <div className="max-w-sm mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
                <div className="text-4xl">⚠️</div>
                <p className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar entregadores</p>
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                <button
                    onClick={onRetry}
                    className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    );
});

EntregadoresErrorState.displayName = 'EntregadoresErrorState';

interface EntregadoresEmptyStateProps {
    searchTerm: string;
}

export const EntregadoresEmptyState = React.memo(function EntregadoresEmptyState({
    searchTerm
}: EntregadoresEmptyStateProps) {
    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {searchTerm.trim() ? 'Nenhum entregador encontrado' : 'Nenhum entregador disponível'}
            </p>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                {searchTerm.trim()
                    ? `Nenhum entregador corresponde à pesquisa "${searchTerm}".`
                    : 'Não há entregadores que aparecem tanto no marketing quanto nas corridas.'}
            </p>
        </div>
    );
});

EntregadoresEmptyState.displayName = 'EntregadoresEmptyState';
