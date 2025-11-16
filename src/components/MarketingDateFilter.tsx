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
    let dataInicial = tempDataInicial || null;
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
    <Card className="group relative overflow-hidden border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 shadow-md transition-all duration-300 hover:shadow-lg hover:border-purple-300/50 dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-900/50">
      {/* Efeito de gradiente de fundo */}
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-opacity group-hover:opacity-50"></div>
      
      <div className="relative">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm">
                <Calendar className="h-3 w-3" />
              </div>
              {label}
            </CardTitle>
            {temFiltro && (
              <Button
                onClick={handleLimpar}
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2 px-3 pb-2">
          {/* Campos de data */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`data-inicial-${label}`} className="flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                <svg className="h-3 w-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
                De
              </Label>
              <Input
                id={`data-inicial-${label}`}
                type="date"
                value={tempDataInicial}
                onChange={handleDataInicialChange}
                min={dataMinima}
                max={hoje}
                className="h-8 text-xs transition-all duration-200 focus:border-purple-500 focus:ring-purple-500/30 hover:border-purple-400 dark:focus:border-purple-400 dark:hover:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`data-final-${label}`} className="flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                <svg className="h-3 w-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4 4 4-4m0 6l-4-4-4 4" />
                </svg>
                Até
              </Label>
              <Input
                id={`data-final-${label}`}
                type="date"
                value={tempDataFinal}
                onChange={handleDataFinalChange}
                min={tempDataInicial || dataMinima}
                max={hoje}
                className="h-8 text-xs transition-all duration-200 focus:border-purple-500 focus:ring-purple-500/30 hover:border-purple-400 dark:focus:border-purple-400 dark:hover:border-purple-500"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 px-3 pb-3">
          {/* Botão Aplicar */}
          <Button
            onClick={handleAplicar}
            disabled={!temAlteracao && !temFiltro}
            size="sm"
            className="w-full h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm transition-all duration-200 hover:from-purple-700 hover:to-pink-700 hover:shadow-md disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
          >
            Aplicar
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default MarketingDateFilter;
