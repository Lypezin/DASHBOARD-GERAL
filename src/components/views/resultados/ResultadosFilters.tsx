'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { Card } from '@/components/ui/card';
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
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-purple-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <Card className="relative border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 shadow-lg dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 h-64 w-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-pink-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <span className="text-sm">🔍</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Filtros de Data
            </p>
          </div>
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
    </div>
  );
});

ResultadosFilters.displayName = 'ResultadosFilters';

