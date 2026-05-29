'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, Search } from 'lucide-react';
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
    hasPendingChanges,
}) => {
    return (
        <Card className="overflow-hidden border-none bg-white/80 shadow-md backdrop-blur-md dark:bg-slate-900/80">
            <MarketingFiltersHeader hasActiveFilters={hasActiveFilters} onClearFilters={handleClearFilters} />

            <CardContent className="space-y-6 bg-white p-6 dark:bg-slate-900">
                <MarketingQuickFilters onQuickFilter={handleQuickFilter} />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <MarketingDateRangeFilter filters={filters} setFilters={setFilters} />
                    <MarketingCityFilter filters={filters} setFilters={setFilters} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters && !hasPendingChanges}
                        className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpar Filtros
                    </Button>
                    <Button
                        onClick={handleApplyFilters}
                        disabled={!hasPendingChanges}
                        className={`w-full transition-all duration-300 md:w-auto ${
                            hasPendingChanges
                                ? 'bg-sky-600 shadow-md hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                    >
                        <Search className="mr-2 h-4 w-4" />
                        {hasPendingChanges ? 'Aplicar Filtros' : 'Filtros Atualizados'}
                    </Button>
                </div>

                <MarketingActiveFiltersSummary hasActiveFilters={hasActiveFilters} appliedFilters={appliedFilters} />
            </CardContent>
        </Card>
    );
};
