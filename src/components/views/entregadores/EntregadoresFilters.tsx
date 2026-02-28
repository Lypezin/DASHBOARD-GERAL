'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { CIDADES as CIDADES_MARKETING } from '@/constants/marketing';

interface EntregadoresFiltersProps {
  searchTerm: string; onSearchChange: (value: string) => void;
  cidadeSelecionada: string; onCidadeChange: (value: string) => void;
  filtroRodouDia: MarketingDateFilter; onFiltroRodouDiaChange: (filter: MarketingDateFilter) => void;
  filtroDataInicio: MarketingDateFilter; onFiltroDataInicioChange: (filter: MarketingDateFilter) => void;
}

const CIDADES = ['', ...CIDADES_MARKETING];

export const EntregadoresFilters = React.memo(function EntregadoresFilters({
  searchTerm, onSearchChange, cidadeSelecionada, onCidadeChange,
  filtroRodouDia, onFiltroRodouDiaChange, filtroDataInicio, onFiltroDataInicioChange,
}: EntregadoresFiltersProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200">
            Filtros
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Campo de Busca */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Buscar Entregador
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filtro de Cidade */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Cidade
              </label>
              <select
                value={cidadeSelecionada}
                onChange={(e) => onCidadeChange(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CIDADES.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade || 'Todas as cidades'}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Filtro Rodou Dia */}
          <MarketingDateFilterComponent
            label="Filtro de Rodou Dia"
            filter={filtroRodouDia}
            onFilterChange={onFiltroRodouDiaChange}
          />

          {/* Filtro Data das Corridas */}
          <MarketingDateFilterComponent
            label="Data das Corridas"
            filter={filtroDataInicio}
            onFilterChange={onFiltroDataInicioChange}
          />
        </div>
      </CardContent>
    </Card>
  );
});

EntregadoresFilters.displayName = 'EntregadoresFilters';

