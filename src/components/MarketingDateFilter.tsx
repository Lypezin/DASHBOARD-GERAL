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
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20">
      {/* Efeito de gradiente de fundo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl transition-opacity group-hover:opacity-60 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-pink-500/10 to-purple-500/10 blur-2xl transition-opacity group-hover:opacity-40"></div>
      </div>
      
      <div className="relative">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md transition-transform group-hover:scale-110">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {label}
              </span>
            </CardTitle>
            {temFiltro && (
              <Button
                onClick={handleLimpar}
                variant="ghost"
                size="sm"
                className="h-7 w-7 rounded-lg p-0 text-slate-600 transition-all hover:bg-rose-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 px-4 pb-3">
          {/* Campos de data */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`data-inicial-${label}`} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <svg className="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="h-9 rounded-xl border-2 border-slate-200 bg-white text-xs transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-purple-400 dark:hover:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`data-final-${label}`} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <svg className="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="h-9 rounded-xl border-2 border-slate-200 bg-white text-xs transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-purple-400 dark:hover:border-purple-500"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 px-4 pb-4">
          {/* Botão Aplicar */}
          <Button
            onClick={handleAplicar}
            disabled={!temAlteracao && !temFiltro}
            size="sm"
            className="w-full h-9 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-md transition-all duration-300 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 hover:shadow-lg hover:scale-[1.02] disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            type="button"
          >
            {temAlteracao ? 'Aplicar Filtro' : temFiltro ? 'Filtro Ativo' : 'Aplicar'}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default MarketingDateFilter;
