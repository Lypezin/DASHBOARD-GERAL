
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MarketingActiveFiltersSummaryProps {
    hasActiveFilters: boolean;
    appliedFilters: {
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    };
}

export const MarketingActiveFiltersSummary: React.FC<MarketingActiveFiltersSummaryProps> = ({
    hasActiveFilters,
    appliedFilters
}) => {
    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300">
            <span className="font-medium">Filtros Aplicados:</span>
            <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                {new Date(appliedFilters.dataInicial + 'T00:00:00').toLocaleDateString('pt-BR')}
                {' → '}
                {new Date(appliedFilters.dataFinal + 'T00:00:00').toLocaleDateString('pt-BR')}
            </Badge>
            {appliedFilters.praca && (
                <>
                    <span className="font-medium ml-2">Praça:</span>
                    <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                        {appliedFilters.praca}
                    </Badge>
                </>
            )}
        </div>
    );
};
