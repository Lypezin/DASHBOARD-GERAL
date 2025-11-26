'use client';

import React, { useState, useEffect } from 'react';
import { MarketingDateFilter as MarketingDateFilterType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';

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
  // Estado local para valores temporários (não aplicados ainda)
  const [tempDataInicial, setTempDataInicial] = useState<string>(filter.dataInicial || '');
  const [tempDataFinal, setTempDataFinal] = useState<string>(filter.dataFinal || '');

  // Sincronizar estado local quando filtro externo mudar
  useEffect(() => {
    setTempDataInicial(filter.dataInicial || '');
    setTempDataFinal(filter.dataFinal || '');
  }, [filter.dataInicial, filter.dataFinal]);

  const handleDataInicialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempDataInicial(value);
  };

  const handleDataFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempDataFinal(value);
  };

  const handleAplicar = () => {
    // Validar datas antes de aplicar
    const dataInicial = tempDataInicial || null;
    let dataFinal = tempDataFinal || null;

    // Validar que data final >= data inicial
    if (dataInicial && dataFinal && dataFinal < dataInicial) {
      dataFinal = dataInicial;
      setTempDataFinal(dataInicial);
    }

    onFilterChange({
      dataInicial,
      dataFinal,
    });
  };

  const handleLimpar = () => {
    setTempDataInicial('');
    setTempDataFinal('');
    onFilterChange({
      dataInicial: null,
      dataFinal: null,
    });
  };

  const hoje = new Date().toISOString().split('T')[0];
  const dataMinima = '2020-01-01';
  const temFiltro = filter.dataInicial || filter.dataFinal;
  const temAlteracao = tempDataInicial !== (filter.dataInicial || '') || tempDataFinal !== (filter.dataFinal || '');

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Calendar className="h-4 w-4 text-slate-500" />
            {label}
          </CardTitle>
          {temFiltro && (
            <Button
              onClick={handleLimpar}
              variant="ghost"
              size="sm"
              className="h-6 w-6 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              type="button"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-3">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`data-inicial-${label}`} className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id={`data-inicial-${label}`}
              type="date"
              value={tempDataInicial}
              onChange={handleDataInicialChange}
              min={dataMinima}
              max={hoje}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`data-final-${label}`} className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id={`data-final-${label}`}
              type="date"
              value={tempDataFinal}
              onChange={handleDataFinalChange}
              min={tempDataInicial || dataMinima}
              max={hoje}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-4 pb-4">
        <Button
          onClick={handleAplicar}
          disabled={!temAlteracao && !temFiltro}
          size="sm"
          variant={temAlteracao ? "default" : "secondary"}
          className="w-full h-8 text-xs"
          type="button"
        >
          {temAlteracao ? 'Aplicar Filtro' : temFiltro ? 'Filtro Ativo' : 'Aplicar'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MarketingDateFilter;
