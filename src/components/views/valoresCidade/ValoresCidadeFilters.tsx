import React from 'react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { ValoresCidadeDateFilter, MarketingDateFilter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Sparkles } from 'lucide-react';

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
    <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
      {/* Gradient Header */}
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/10 dark:via-teal-900/10 dark:to-cyan-900/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Filtros de Data
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Filtre os dados financeiros por período
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 pb-5">
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

