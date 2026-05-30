import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.48)] dark:border-slate-800/70 dark:bg-slate-900/80">
            <CardContent className="p-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar entregador por nome ou ID..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 py-2.5 pl-10 pr-11 text-sm transition-[background-color,border-color,box-shadow] duration-150 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white dark:focus:bg-slate-900"
                    />

                    {searchTerm ? (
                        <button
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    ) : null}

                    {isSearching ? (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                        </div>
                    ) : null}
                </div>

                {searchTerm ? (
                    <p className="mt-2 text-xs text-slate-500">
                        {isSearching ? 'Pesquisando...' : `Encontrados ${totalResults} resultado${totalResults === 1 ? '' : 's'}`}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
});
