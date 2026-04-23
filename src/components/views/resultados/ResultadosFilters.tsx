'use client';

import React from 'react';
import { MarketingDateFilter } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
      {/* Header simples */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40">
            <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Filtros de Data
          </span>
        </div>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={!hasData}
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 h-8"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </Button>
        )}
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro Liberação */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Liberação</span>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2">
              <MarketingDateFilterComponent
                label=""
                filter={filtroLiberacao}
                onFilterChange={onFiltroLiberacaoChange}
              />
            </div>
          </div>

          {/* Filtro Enviados */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Send className="h-3.5 w-3.5" />
              <span>Enviados</span>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2">
              <MarketingDateFilterComponent
                label=""
                filter={filtroEnviados}
                onFilterChange={onFiltroEnviadosChange}
              />
            </div>
          </div>

          {/* Filtro Enviados (Liberados) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5" />
              <span>Valores</span>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2">
              <MarketingDateFilterComponent
                label=""
                filter={filtroEnviadosLiberados}
                onFilterChange={onFiltroEnviadosLiberadosChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ResultadosFilters.displayName = 'ResultadosFilters';
