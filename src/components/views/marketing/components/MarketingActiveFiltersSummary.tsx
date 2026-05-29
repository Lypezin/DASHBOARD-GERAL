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
    appliedFilters,
}) => {
    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300">
            <span className="font-medium">Filtros aplicados:</span>
            <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                {new Date(appliedFilters.dataInicial + 'T00:00:00').toLocaleDateString('pt-BR')}
                {' -> '}
                {new Date(appliedFilters.dataFinal + 'T00:00:00').toLocaleDateString('pt-BR')}
            </Badge>
            {appliedFilters.praca && (
                <>
                    <span className="ml-2 font-medium">Praca:</span>
                    <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                        {appliedFilters.praca}
                    </Badge>
                </>
            )}
        </div>
    );
};
