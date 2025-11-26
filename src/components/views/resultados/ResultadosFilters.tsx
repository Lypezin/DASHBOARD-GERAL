'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { Card } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

interface ResultadosFiltersProps {
  filtroLiberacao: MarketingDateFilter;
  filtroEnviados: MarketingDateFilter;
  filtroEnviadosLiberados: MarketingDateFilter;
  onFiltroLiberacaoChange: (filter: MarketingDateFilter) => void;
  onFiltroEnviadosChange: (filter: MarketingDateFilter) => void;
  onFiltroEnviadosLiberadosChange: (filter: MarketingDateFilter) => void;
}

export const ResultadosFilters = React.memo(function ResultadosFilters({
  filtroLiberacao,
  filtroEnviados,
  filtroEnviadosLiberados,
  onFiltroLiberacaoChange,
  onFiltroEnviadosChange,
  onFiltroEnviadosLiberadosChange,
}: ResultadosFiltersProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">
            Filtros de Data
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MarketingDateFilterComponent
            label="Filtro de Liberação"
            filter={filtroLiberacao}
            onFilterChange={onFiltroLiberacaoChange}
          />
          <MarketingDateFilterComponent
            label="Filtro de Enviados"
            filter={filtroEnviados}
            onFilterChange={onFiltroEnviadosChange}
          />
          <MarketingDateFilterComponent
            label="Filtro de Enviados (Liberados)"
            filter={filtroEnviadosLiberados}
            onFilterChange={onFiltroEnviadosLiberadosChange}
          />
        </div>
      </div>
    </Card>
  );
});

ResultadosFilters.displayName = 'ResultadosFilters';

