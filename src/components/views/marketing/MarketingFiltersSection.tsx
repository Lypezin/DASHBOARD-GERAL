'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { MarketingFilters } from '@/types';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface MarketingFiltersSectionProps {
  filters: MarketingFilters;
  onFilterChange: (filterName: keyof MarketingFilters, value: any) => void;
}

export const MarketingFiltersSection = React.memo(function MarketingFiltersSection({
  filters,
  onFilterChange,
}: MarketingFiltersSectionProps) {
  return (
    <SaasPanel className="overflow-visible">
      <SaasPanelHeader
        eyebrow="Filtros"
        title="Filtros de data"
        description="Personalize sua visualização de dados por etapa do funil."
        icon={Filter}
        tone="slate"
      />
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <MarketingDateFilterComponent
          label="Filtro de liberação"
          filter={filters.filtroLiberacao}
          onFilterChange={(filter) => onFilterChange('filtroLiberacao', filter)}
        />
        <MarketingDateFilterComponent
          label="Filtro de enviados"
          filter={filters.filtroEnviados}
          onFilterChange={(filter) => onFilterChange('filtroEnviados', filter)}
        />
        <MarketingDateFilterComponent
          label="Filtro de rodou dia"
          filter={filters.filtroRodouDia}
          onFilterChange={(filter) => onFilterChange('filtroRodouDia', filter)}
        />
        <MarketingDateFilterComponent
          label="Filtro de data início"
          filter={filters.filtroDataInicio}
          onFilterChange={(filter) => onFilterChange('filtroDataInicio', filter)}
        />
      </div>
    </SaasPanel>
  );
});
