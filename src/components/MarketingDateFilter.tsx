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
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const [anoSelecionado, setAnoSelecionado] = useState<string>('');

  // Função para obter primeiro e último dia do mês
  const getFirstAndLastDayOfMonth = (ano: number, mes: number) => {
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    const primeiroDiaStr = primeiroDia.toISOString().split('T')[0];
    const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];
    
    return { primeiroDiaStr, ultimoDiaStr };
  };

  // Quando mês/ano mudar, atualizar automaticamente as datas
  useEffect(() => {
    if (mesSelecionado && anoSelecionado) {
      const mes = parseInt(mesSelecionado);
      const ano = parseInt(anoSelecionado);
      const { primeiroDiaStr, ultimoDiaStr } = getFirstAndLastDayOfMonth(ano, mes);
      
      // Só atualizar se as datas forem diferentes das atuais
      if (filter.dataInicial !== primeiroDiaStr || filter.dataFinal !== ultimoDiaStr) {
        onFilterChange({
          dataInicial: primeiroDiaStr,
          dataFinal: ultimoDiaStr,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionado, anoSelecionado]);

  // Sincronizar mês/ano selecionado com as datas do filtro
  useEffect(() => {
    if (filter.dataInicial && filter.dataFinal) {
      const dataInicial = new Date(filter.dataInicial);
      const dataFinal = new Date(filter.dataFinal);
      
      // Verificar se as datas correspondem ao primeiro e último dia do mesmo mês
      const primeiroDiaMes = new Date(dataInicial.getFullYear(), dataInicial.getMonth(), 1);
      const ultimoDiaMes = new Date(dataInicial.getFullYear(), dataInicial.getMonth() + 1, 0);
      
      if (
        dataInicial.getTime() === primeiroDiaMes.getTime() &&
        dataFinal.getTime() === ultimoDiaMes.getTime() &&
        dataInicial.getMonth() === dataFinal.getMonth() &&
        dataInicial.getFullYear() === dataFinal.getFullYear()
      ) {
        // As datas correspondem a um mês completo
        setMesSelecionado(String(dataInicial.getMonth() + 1).padStart(2, '0'));
        setAnoSelecionado(String(dataInicial.getFullYear()));
      } else {
        // As datas não correspondem a um mês completo, limpar seleção
        setMesSelecionado('');
        setAnoSelecionado('');
      }
    } else {
      setMesSelecionado('');
      setAnoSelecionado('');
    }
  }, [filter.dataInicial, filter.dataFinal]);

  const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMesSelecionado(e.target.value);
  };

  const handleAnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnoSelecionado(e.target.value);
  };

  const handleDataInicialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    // Limpar seleção de mês/ano quando data manual for alterada
    if (value) {
      setMesSelecionado('');
      setAnoSelecionado('');
    }
    onFilterChange({
      ...filter,
      dataInicial: value,
    });
  };

  const handleDataFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null;
    
    // Limpar seleção de mês/ano quando data manual for alterada
    if (value) {
      setMesSelecionado('');
      setAnoSelecionado('');
    }
    
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

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;
  
  // Gerar lista de anos (últimos 5 anos até o atual)
  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - i);
  
  // Gerar lista de meses
  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const dataMinima = '2020-01-01';
  const hojeStr = hoje.toISOString().split('T')[0];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        {label}
      </label>
      
      {/* Seletores de Mês/Ano */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            Mês
          </label>
          <select
            value={mesSelecionado}
            onChange={handleMesChange}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400"
          >
            <option value="">Selecione...</option>
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            Ano
          </label>
          <select
            value={anoSelecionado}
            onChange={handleAnoChange}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400"
          >
            <option value="">Selecione...</option>
            {anos.map((ano) => (
              <option key={ano} value={String(ano)}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campos de Data Específica */}
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
            max={hojeStr}
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
            max={hojeStr}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-400"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketingDateFilter;

