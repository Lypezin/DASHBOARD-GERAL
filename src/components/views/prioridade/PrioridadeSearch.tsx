import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
        
        <CardContent className="relative p-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Pesquisar entregador por nome ou ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 pl-12 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
              ) : (
                <span className="text-lg">🔍</span>
              )}
            </div>
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {isSearching ? (
                'Pesquisando...'
              ) : (
                `Encontrado${totalResults === 1 ? '' : 's'} ${totalResults} resultado${totalResults === 1 ? '' : 's'}`
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

