
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
    temAlteracao
  } = useDateFilterState(filter, onFilterChange);

  return (
    <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
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

      <MarketingDateFilterActions 
        handleAplicar={handleAplicar}
        temAlteracao={!!temAlteracao}
        temFiltro={!!temFiltro}
      />
    </Card>
  );
};

export default MarketingDateFilter;

