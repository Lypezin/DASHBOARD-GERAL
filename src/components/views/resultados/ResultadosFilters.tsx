'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { CardContent } from '@/components/ui/card';
import { Filter, Calendar, Send, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

interface ResultadosFiltersProps {
  filtroLiberacao: MarketingDateFilter; filtroEnviados: MarketingDateFilter; filtroEnviadosLiberados: MarketingDateFilter;
  onFiltroLiberacaoChange: (filter: MarketingDateFilter) => void; onFiltroEnviadosChange: (filter: MarketingDateFilter) => void;
  onFiltroEnviadosLiberadosChange: (filter: MarketingDateFilter) => void; onExport?: () => void; hasData?: boolean;
}

export const ResultadosFilters = React.memo(function ResultadosFilters({
  filtroLiberacao, filtroEnviados, filtroEnviadosLiberados, onFiltroLiberacaoChange,
  onFiltroEnviadosChange, onFiltroEnviadosLiberadosChange, onExport, hasData
}: ResultadosFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Período de análise
          </span>
        </div>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={!hasData}
            className="flex items-center gap-2 h-9 text-sm font-medium border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        )}
      </div>

      {/* Filter fields */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Liberação
            </label>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-2.5">
              <MarketingDateFilterComponent
                label=""
                filter={filtroLiberacao}
                onFilterChange={onFiltroLiberacaoChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Send className="h-3.5 w-3.5" />
              Enviados
            </label>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-2.5">
              <MarketingDateFilterComponent
                label=""
                filter={filtroEnviados}
                onFilterChange={onFiltroEnviadosChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Valores
            </label>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-2.5">
              <MarketingDateFilterComponent
                label=""
                filter={filtroEnviadosLiberados}
                onFilterChange={onFiltroEnviadosLiberadosChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ResultadosFilters.displayName = 'ResultadosFilters';
