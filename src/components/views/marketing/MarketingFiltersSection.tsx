'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { MarketingFilters } from '@/types';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

interface MarketingFiltersSectionProps {
    filters: MarketingFilters;
    onFilterChange: (filterName: keyof MarketingFilters, value: any) => void;
}

export const MarketingFiltersSection = React.memo(function MarketingFiltersSection({
    filters,
    onFilterChange,
}: MarketingFiltersSectionProps) {
    return (
        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
            {/* Simple Header */}
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Filter className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                Filtros de Data
                            </CardTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Personalize sua visualização de dados
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MarketingDateFilterComponent
                        label="Filtro de Liberação"
                        filter={filters.filtroLiberacao}
                        onFilterChange={(filter) => onFilterChange('filtroLiberacao', filter)}
                    />
                    <MarketingDateFilterComponent
                        label="Filtro de Enviados"
                        filter={filters.filtroEnviados}
                        onFilterChange={(filter) => onFilterChange('filtroEnviados', filter)}
                    />
                    <MarketingDateFilterComponent
                        label="Filtro de Rodou Dia"
                        filter={filters.filtroRodouDia}
                        onFilterChange={(filter) => onFilterChange('filtroRodouDia', filter)}
                    />
                    <MarketingDateFilterComponent
                        label="Filtro de Data Início"
                        filter={filters.filtroDataInicio}
                        onFilterChange={(filter) => onFilterChange('filtroDataInicio', filter)}
                    />
                </div>
            </CardContent>
        </Card>
    );
});

