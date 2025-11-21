'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { CIDADES as CIDADES_MARKETING } from '@/constants/marketing';

interface EntregadoresFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  cidadeSelecionada: string;
  onCidadeChange: (value: string) => void;
  filtroRodouDia: MarketingDateFilter;
  onFiltroRodouDiaChange: (filter: MarketingDateFilter) => void;
  filtroDataInicio: MarketingDateFilter;
  onFiltroDataInicioChange: (filter: MarketingDateFilter) => void;
}

const CIDADES = ['', ...CIDADES_MARKETING];

export const EntregadoresFilters = React.memo(function EntregadoresFilters({
  searchTerm,
  onSearchChange,
  cidadeSelecionada,
  onCidadeChange,
  filtroRodouDia,
  onFiltroRodouDiaChange,
  filtroDataInicio,
  onFiltroDataInicioChange,
}: EntregadoresFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Campo de Busca */}
      <div className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-opacity group-hover:opacity-50"></div>
        </div>
        <div className="relative">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            🔍 Buscar Entregador
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-purple-500" />
            <Input
              type="text"
              placeholder="Pesquisar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-purple-400 dark:hover:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Filtro de Cidade */}
      <div className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-pink-500/10 to-purple-500/10 blur-2xl transition-opacity group-hover:opacity-50"></div>
        </div>
        <div className="relative">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            📍 Cidade
          </label>
          <select
            value={cidadeSelecionada}
            onChange={(e) => onCidadeChange(e.target.value)}
            className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-purple-400 dark:hover:border-purple-500"
          >
            {CIDADES.map((cidade) => (
              <option key={cidade} value={cidade}>
                {cidade || 'Todas as cidades'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro Rodou Dia */}
      <MarketingDateFilterComponent
        label="Filtro de Rodou Dia"
        filter={filtroRodouDia}
        onFilterChange={onFiltroRodouDiaChange}
      />
      
      {/* Filtro Data Início */}
      <MarketingDateFilterComponent
        label="Data Início"
        filter={filtroDataInicio}
        onFilterChange={onFiltroDataInicioChange}
      />
    </div>
  );
});

EntregadoresFilters.displayName = 'EntregadoresFilters';

