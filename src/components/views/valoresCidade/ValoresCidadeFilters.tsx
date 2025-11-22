import React from 'react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { ValoresCidadeDateFilter, MarketingDateFilter } from '@/types';

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
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-purple-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative rounded-3xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 p-6 shadow-xl dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 h-64 w-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-pink-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <span className="text-lg">🔍</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Filtros de Data
            </p>
          </div>
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
        </div>
      </div>
    </div>
  );
};

