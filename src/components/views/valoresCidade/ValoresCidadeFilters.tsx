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
    <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
      <MarketingDateFilterComponent
        label="Período de liberação"
        filter={filter as MarketingDateFilter}
        onFilterChange={(newFilter) => onFilterChange(newFilter as ValoresCidadeDateFilter)}
      />
      <MarketingDateFilterComponent
        label="Período de enviados"
        filter={filterEnviados}
        onFilterChange={onFilterEnviadosChange}
      />
    </div>
  );
};

