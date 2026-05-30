import React from 'react';
import { ValoresCidadePorCidade } from '@/types';
import { DollarSign, BarChart3 } from 'lucide-react';
import { SummaryCard } from './components/SummaryCard';
import { CityValuesGrid } from './components/CityValuesGrid';
import { CityCostGrid } from './components/CityCostGrid';

interface ValoresCidadeCardsProps {
  totalGeral: number;
  custoPorLiberado: number;
  cidadesData: ValoresCidadePorCidade[];
}

export const ValoresCidadeCards: React.FC<ValoresCidadeCardsProps> = ({
  totalGeral,
  custoPorLiberado,
  cidadesData,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Geral"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
          subtext="Valor total acumulado"
          icon={DollarSign}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
        />

        <SummaryCard
          title="Custo por Liberado"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoPorLiberado)}
          subtext={'M\u00e9dia geral'}
          icon={BarChart3}
          colorClass="text-sky-600 dark:text-sky-300"
          bgClass="from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900"
          iconBgClass="bg-sky-100 dark:bg-sky-900/40"
        />
      </div>

      <div className="space-y-8">
        <CityValuesGrid cidadesData={cidadesData} />
        <CityCostGrid cidadesData={cidadesData} />
      </div>
    </div>
  );
};
