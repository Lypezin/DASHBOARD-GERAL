import React from 'react';
import { Search, X } from 'lucide-react';

interface PrioridadeSearchProps {
  searchTerm: string;
  isSearching: boolean;
  totalResults: number;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export const PrioridadeSearch: React.FC<PrioridadeSearchProps> = ({
  searchTerm,
  isSearching,
  totalResults,
  onSearchChange,
  onClearSearch,
}) => (
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      <input
        type="text"
        role="searchbox"
        aria-label="Pesquisar entregador por nome ou ID"
        placeholder="Pesquisar por nome ou ID"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`h-11 w-full rounded-lg border border-[#d8e4eb] bg-white pl-10 ${isSearching ? 'pr-[4.5rem]' : 'pr-10'} text-sm text-slate-800 placeholder:text-slate-400 transition-colors duration-150 focus:border-[#38708e] focus:outline-none focus:ring-2 focus:ring-[#38708e]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500`}
      />
      {searchTerm ? (
        <button
          type="button"
          onClick={onClearSearch}
          aria-label="Limpar pesquisa"
          className={`absolute ${isSearching ? 'right-9' : 'right-2.5'} top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
      {isSearching ? (
        <span role="status" aria-label="Pesquisando" className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#174d70] motion-reduce:animate-none dark:border-slate-700 dark:border-t-sky-300" />
        </span>
      ) : null}
    </div>
    <p aria-live="polite" className="min-h-5 shrink-0 px-0.5 text-xs text-slate-500 dark:text-slate-400">
      {isSearching
        ? 'Pesquisando…'
        : `${totalResults.toLocaleString('pt-BR')} ${searchTerm ? 'resultado(s)' : 'entregadores'}`}
    </p>
  </div>
);
