'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      </CardContent>
    </Card>
  );
});

ResultadosFilters.displayName = 'ResultadosFilters';

