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
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
            <CardContent className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar entregador por nome ou ID..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-sm rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    {searchTerm && (
                        <button
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                    {isSearching && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                        </div>
                    )}
                </div>
                {searchTerm && (
                    <p className="mt-2 text-xs text-slate-500">
                        {isSearching ? 'Pesquisando...' : `Encontrado${totalResults === 1 ? '' : 's'} ${totalResults} resultado${totalResults === 1 ? '' : 's'}`}
                    </p>
                )}
            </CardContent>
        </Card>
    );
});
