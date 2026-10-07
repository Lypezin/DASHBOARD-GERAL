import React from 'react';
import { Search, X } from 'lucide-react';

interface ValoresSearchProps {
    searchTerm: string;
    isSearching: boolean;
    totalResults: number;
    onSearchChange: (term: string) => void;
    onClearSearch: () => void;
}

export const ValoresSearch = React.memo(function ValoresSearch({
    searchTerm,
    isSearching,
    totalResults,
    onSearchChange,
    onClearSearch,
}: ValoresSearchProps) {
    return (
        <div className="w-full min-w-0 sm:max-w-[28rem] sm:flex-1">
            <label htmlFor="valores-entregador-search" className="sr-only">
                Pesquisar entregador por nome ou ID
            </label>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                    id="valores-entregador-search"
                    type="text"
                    placeholder="Pesquisar por nome ou ID..."
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="h-11 w-full rounded-md border border-[#d7e2e8] bg-white py-2 pl-10 pr-11 text-[13px] font-normal text-slate-800 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-sky-600/60 focus:outline-none focus:ring-2 focus:ring-sky-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-300/60"
                />

                {searchTerm ? (
                    <button
                        type="button"
                        onClick={onClearSearch}
                        aria-label="Limpar busca"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                ) : null}

                {isSearching ? (
                    <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2" aria-hidden="true">
                        <span className="block h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-slate-200 border-t-sky-700 dark:border-slate-700 dark:border-t-sky-300" />
                    </span>
                ) : null}
            </div>

            {searchTerm ? (
                <p aria-live="polite" className="mt-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">
                    {isSearching ? 'Pesquisando...' : `Encontrados ${totalResults} resultado${totalResults === 1 ? '' : 's'}`}
                </p>
            ) : null}
        </div>
    );
});

ValoresSearch.displayName = 'ValoresSearch';
