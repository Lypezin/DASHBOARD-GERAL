'use client';

import React, { useState, useEffect } from 'react';
import { MarketingDateFilter as MarketingDateFilterType } from '@/types';

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
    // Não aplicar automaticamente - apenas atualizar estado local
  };

  const handleDataFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempDataFinal(value);
    // Não aplicar automaticamente - apenas atualizar estado local
  };

  const handleDataInicialBlur = () => {
    // Aplicar filtro apenas quando campo perder foco e data estiver completa
    const value = tempDataInicial || null;
    
    // Validar data final se necessário
    let finalValue = tempDataFinal || null;
    if (value && finalValue && finalValue < value) {
      finalValue = value;
      setTempDataFinal(value);
    }
    
    onFilterChange({
      dataInicial: value,
      dataFinal: finalValue || filter.dataFinal,
    });
  };

  const handleDataFinalBlur = () => {
    // Aplicar filtro apenas quando campo perder foco e data estiver completa
    const value = tempDataFinal || null;
    
    // Validar que data final >= data inicial
    if (value && tempDataInicial && value < tempDataInicial) {
      const adjustedValue = tempDataInicial;
      setTempDataFinal(adjustedValue);
      onFilterChange({
        ...filter,
        dataFinal: adjustedValue,
      });
    } else {
      onFilterChange({
        ...filter,
        dataFinal: value,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'inicial' | 'final') => {
    // Aplicar filtro quando pressionar Enter
    if (e.key === 'Enter') {
      if (field === 'inicial') {
        handleDataInicialBlur();
      } else {
        handleDataFinalBlur();
      }
    }
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

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {temFiltro && (
          <button
            onClick={handleLimpar}
            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            type="button"
          >
            Limpar
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            De
          </label>
          <input
            type="date"
            value={tempDataInicial}
            onChange={handleDataInicialChange}
            onBlur={handleDataInicialBlur}
            onKeyDown={(e) => handleKeyDown(e, 'inicial')}
            min={dataMinima}
            max={hoje}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            Até
          </label>
          <input
            type="date"
            value={tempDataFinal}
            onChange={handleDataFinalChange}
            onBlur={handleDataFinalBlur}
            onKeyDown={(e) => handleKeyDown(e, 'final')}
            min={tempDataInicial || dataMinima}
            max={hoje}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketingDateFilter;
