import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface EntregadoresMainSearchProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export const EntregadoresMainSearch = React.memo(function EntregadoresMainSearch({
    searchTerm,
    onSearchChange,
}: EntregadoresMainSearchProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou ID do entregador..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>
            </CardContent>
        </Card>
    );
});
