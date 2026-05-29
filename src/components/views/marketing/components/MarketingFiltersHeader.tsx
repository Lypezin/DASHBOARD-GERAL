
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketingFiltersHeaderProps {
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export const MarketingFiltersHeader: React.FC<MarketingFiltersHeaderProps> = ({
    hasActiveFilters,
    onClearFilters
}) => {
    return (
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-indigo-500" />
                        Filtros
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-500">
                        Selecione o período e praça, depois clique em Aplicar
                    </CardDescription>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                    </Button>
                )}
            </div>
        </CardHeader>
    );
};
