import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Sparkles } from 'lucide-react';
import { MarketingFilters, MarketingDateFilter } from '@/types';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

interface MarketingFiltersSectionProps {
    filters: MarketingFilters;
    onFilterChange: (filterName: keyof MarketingFilters, filter: MarketingDateFilter) => void;
}

export const MarketingFiltersSection = React.memo(function MarketingFiltersSection({
    filters,
    onFilterChange,
}: MarketingFiltersSectionProps) {
    return (
        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
            {/* Gradient Header */}
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-cyan-900/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20">
                        <Filter className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            Filtros de Data
                            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Personalize sua visualização de dados
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-5 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

