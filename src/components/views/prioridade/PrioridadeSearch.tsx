import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
}) => {
  return (
    <Card className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/80 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.18)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40">
      <CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar entregador por nome ou ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold rounded-2xl border border-slate-200 bg-slate-50/50 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/40 dark:text-white dark:placeholder-slate-550"
          />
          {searchTerm && (
            <button
              onClick={onClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            </div>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2.5 pl-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isSearching ? 'Pesquisando...' : `Encontrado${totalResults === 1 ? '' : 's'} ${totalResults} resultado${totalResults === 1 ? '' : 's'}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
