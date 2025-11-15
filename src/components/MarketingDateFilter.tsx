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
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-purple-300/50 dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-900/50">
      {/* Efeito de gradiente de fundo */}
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-opacity group-hover:opacity-50"></div>
      
      <div className="relative">
        {/* Cabeçalho com label e botão limpar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <label className="block text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
              {label}
            </label>
          </div>
          {temFiltro && (
            <button
              onClick={handleLimpar}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-rose-400"
              type="button"
            >
              Limpar
            </button>
          )}
        </div>
        
        {/* Campos de data */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <svg className="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              De
            </label>
            <input
              type="date"
              value={tempDataInicial}
              onChange={handleDataInicialChange}
              min={dataMinima}
              max={hoje}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 hover:border-purple-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400 dark:hover:border-purple-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <svg className="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4 4 4-4m0 6l-4-4-4 4" />
              </svg>
              Até
            </label>
            <input
              type="date"
              value={tempDataFinal}
              onChange={handleDataFinalChange}
              min={tempDataInicial || dataMinima}
              max={hoje}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 hover:border-purple-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400 dark:hover:border-purple-500"
            />
          </div>
        </div>

        {/* Botão Aplicar */}
        <button
          onClick={handleAplicar}
          disabled={!temAlteracao && !temFiltro}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg hover:scale-[1.02] disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:opacity-60"
          type="button"
        >
          Aplicar Filtro
        </button>
      </div>
    </div>
  );
};

export default MarketingDateFilter;
