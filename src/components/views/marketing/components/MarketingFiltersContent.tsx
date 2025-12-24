
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingQuickFilters } from './MarketingQuickFilters';
import { MarketingDateRangeFilter } from './MarketingDateRangeFilter';
import { MarketingCityFilter } from './MarketingCityFilter';
import { MarketingActiveFiltersSummary } from './MarketingActiveFiltersSummary';
import { MarketingFiltersHeader } from './MarketingFiltersHeader';

interface MarketingFiltersContentProps {
    filters: any;
    appliedFilters: any;
    setFilters: any;
    handleApplyFilters: () => void;
    handleClearFilters: () => void;
    handleQuickFilter: (type: 'week' | 'month' | 'quarter' | 'year') => void;
    hasActiveFilters: boolean;
    hasPendingChanges: boolean;
}

export const MarketingFiltersContent: React.FC<MarketingFiltersContentProps> = ({
    filters,
    appliedFilters,
    setFilters,
    handleApplyFilters,
    handleClearFilters,
    handleQuickFilter,
    hasActiveFilters,
    hasPendingChanges
}) => {
    return (
        <Card className="overflow-hidden border-none shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <MarketingFiltersHeader
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
            />

            <CardContent className="p-6 bg-white dark:bg-slate-900 space-y-6">

                <MarketingQuickFilters onQuickFilter={handleQuickFilter} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MarketingDateRangeFilter filters={filters} setFilters={setFilters} />
                    <MarketingCityFilter filters={filters} setFilters={setFilters} />
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end pt-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters && !hasPendingChanges}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Limpar Filtros
                    </Button>
                    <Button
                        onClick={handleApplyFilters}
                        disabled={!hasPendingChanges}
                        className={`w-full md:w-auto transition-all duration-300 ${hasPendingChanges
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        {hasPendingChanges ? 'Aplicar Filtros' : 'Filtros Atualizados'}
                    </Button>
                </div>

                <MarketingActiveFiltersSummary
                    hasActiveFilters={hasActiveFilters}
                    appliedFilters={appliedFilters}
                />
            </CardContent>
        </Card>
    );
};
