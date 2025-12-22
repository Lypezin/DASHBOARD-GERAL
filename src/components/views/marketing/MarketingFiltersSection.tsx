import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
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
        <Card className="border-none shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200">
                        Filtros de Data
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
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
