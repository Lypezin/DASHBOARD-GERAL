'use client';

import React from 'react';
import { MarketingDateFilter as MarketingDateFilterType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { useDateFilterState } from '@/hooks/filters/useDateFilterState';
import { MarketingDateField } from './MarketingDateField';
import { MarketingDateFilterActions } from './MarketingDateFilterActions';

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
    temAlteracao,
  } = useDateFilterState(filter, onFilterChange);

  return (
    <Card className="overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-950/80">
      <CardHeader className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <div className="rounded-lg bg-sky-50 p-1.5 dark:bg-sky-950/40">
              <Calendar className="h-3.5 w-3.5 text-[#347ca3] dark:text-sky-200" />
            </div>
            <span className="min-w-0 text-xs uppercase tracking-wider">{label}</span>
          </CardTitle>
          {temFiltro ? (
            <Button
              onClick={handleLimpar}
              variant="ghost"
              size="sm"
              className="h-7 w-7 shrink-0 rounded-full p-0 text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
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

      <MarketingDateFilterActions
        handleAplicar={handleAplicar}
        temAlteracao={!!temAlteracao}
        temFiltro={!!temFiltro}
      />
    </Card>
  );
};

export default MarketingDateFilter;
