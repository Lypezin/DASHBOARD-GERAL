import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

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
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou ID do entregador..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-[background-color,border-color,box-shadow] duration-150 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:pr-28"
                    />
                    {isSearching ? (
                        <span className="mt-1 block text-right text-xs font-medium text-blue-600 dark:text-blue-300 sm:absolute sm:right-3 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
                            Atualizando...
                        </span>
                    ) : null}
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <button
                        onClick={() => onShowInactiveOnlyChange(!showInactiveOnly)}
                        className={`w-full rounded-full border px-3 py-1.5 text-xs transition-colors sm:w-auto ${showInactiveOnly
                                ? 'bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                    >
                        {showInactiveOnly ? 'Mostrando Inativos (0 completadas)' : 'Filtrar Inativos'}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
});
