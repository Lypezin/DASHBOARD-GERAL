'use client';

import React from 'react';
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
  const handleDataInicialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    onFilterChange({
      ...filter,
      dataInicial: value,
    });
  };

  const handleDataFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    
    // Validar que data final >= data inicial
    if (value && filter.dataInicial && value < filter.dataInicial) {
      onFilterChange({
        ...filter,
        dataFinal: filter.dataInicial,
      });
    } else {
      onFilterChange({
        ...filter,
        dataFinal: value,
      });
    }
  };

  const hoje = new Date().toISOString().split('T')[0];
  const dataMinima = '2020-01-01';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            De
          </label>
          <input
            type="date"
            value={filter.dataInicial || ''}
            onChange={handleDataInicialChange}
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
            value={filter.dataFinal || ''}
            onChange={handleDataFinalChange}
            min={filter.dataInicial || dataMinima}
            max={hoje}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketingDateFilter;

