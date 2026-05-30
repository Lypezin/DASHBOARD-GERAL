import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface EntregadoresMainSearchProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showInactiveOnly: boolean;
    onShowInactiveOnlyChange: (show: boolean) => void;
    isSearching?: boolean;
}

export const EntregadoresMainSearch = React.memo(function EntregadoresMainSearch({
    searchTerm,
    onSearchChange,
    showInactiveOnly,
    onShowInactiveOnlyChange,
    isSearching = false,
}: EntregadoresMainSearchProps) {
    return (
        <div className="rounded-[1.75rem] border border-slate-200/75 bg-white/90 p-4 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.42)] backdrop-blur dark:border-slate-800/75 dark:bg-slate-950/80">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou ID do entregador..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-800/80 dark:bg-slate-900/65 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                    />
                    {isSearching ? (
                        <span className="mt-1 block text-right text-xs font-bold text-emerald-600 dark:text-emerald-300 lg:absolute lg:right-4 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
                            Atualizando...
                        </span>
                    ) : null}
                </div>

                <button
                    onClick={() => onShowInactiveOnlyChange(!showInactiveOnly)}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 lg:w-auto ${showInactiveOnly
                        ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300'
                        : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300'
                        }`}
                    type="button"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    {showInactiveOnly ? 'Mostrando inativos' : 'Filtrar inativos'}
                </button>
            </div>
        </div>
    );
});

EntregadoresMainSearch.displayName = 'EntregadoresMainSearch';
