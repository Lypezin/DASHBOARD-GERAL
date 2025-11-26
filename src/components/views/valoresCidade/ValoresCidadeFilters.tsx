import React from 'react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { ValoresCidadeDateFilter, MarketingDateFilter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface ValoresCidadeFiltersProps {
  filter: ValoresCidadeDateFilter;
  filterEnviados: MarketingDateFilter;
  onFilterChange: (newFilter: ValoresCidadeDateFilter) => void;
  onFilterEnviadosChange: (newFilter: MarketingDateFilter) => void;
}

export const ValoresCidadeFilters: React.FC<ValoresCidadeFiltersProps> = ({
  filter,
  filterEnviados,
  onFilterChange,
  onFilterEnviadosChange,
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200">
            Filtros de Data
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MarketingDateFilterComponent
            label="Filtro de Data"
            filter={filter as MarketingDateFilter}
            onFilterChange={(newFilter) => onFilterChange(newFilter as ValoresCidadeDateFilter)}
          />
          <MarketingDateFilterComponent
            label="Filtro de Enviados"
            filter={filterEnviados}
            onFilterChange={onFilterEnviadosChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

