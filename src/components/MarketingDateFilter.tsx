
'use client';

import React from 'react';
import { MarketingDateFilter as MarketingDateFilterType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, X, Check } from 'lucide-react';
import { useDateFilterState } from '@/hooks/filters/useDateFilterState';
import { MarketingDateField } from './MarketingDateField';

interface MarketingDateFilterProps {
  label: string;
  filter: MarketingDateFilterType;
  onFilterChange: (filter: MarketingDateFilterType) => void;
}

const MarketingDateFilter: React.FC<MarketingDateFilterProps> = ({
  label,
  filter,
  onFilterChange,
}) => {
  const {
    tempDataInicial,
    tempDataFinal,
    handleDataInicialChange,
    handleDataFinalChange,
    handleAplicar,
    handleLimpar,
    hoje,
    dataMinima,
    temFiltro,
    temAlteracao
  } = useDateFilterState(filter, onFilterChange);

  return (
    <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden group">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="uppercase tracking-wider text-xs">{label}</span>
          </CardTitle>
          {temFiltro && (
            <Button
              onClick={handleLimpar}
              variant="ghost"
              size="sm"
              className="h-6 w-6 rounded-full p-0 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300 transition-colors"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <MarketingDateField
            id={`data-inicial-${label}`}
            label="De"
            value={tempDataInicial}
            onChange={handleDataInicialChange}
            min={dataMinima}
            max={hoje}
          />
          <MarketingDateField
            id={`data-final-${label}`}
            label="Até"
            value={tempDataFinal}
            onChange={handleDataFinalChange}
            min={tempDataInicial || dataMinima}
            max={hoje}
          />
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-4 pb-4">
        <Button
          onClick={handleAplicar}
          disabled={!temAlteracao && !temFiltro}
          size="sm"
          variant={temAlteracao ? "default" : "secondary"}
          className={`w-full h-9 text-xs font-semibold transition-all ${temAlteracao
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md shadow-purple-500/20'
            : temFiltro
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : ''
            }`}
          type="button"
        >
          {temAlteracao ? (
            <>Aplicar Filtro</>
          ) : temFiltro ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Filtro Ativo
            </span>
          ) : (
            'Aplicar'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MarketingDateFilter;

