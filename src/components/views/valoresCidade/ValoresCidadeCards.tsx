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
    <div className="space-y-7">
      <section aria-labelledby="valores-cidade-summary-title" className="space-y-3">
        <div className="px-0.5">
          <h2 id="valores-cidade-summary-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">Resumo financeiro</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Totais do período selecionado</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryCard
          title="Total Geral"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
          subtext="Valor total acumulado"
          icon={DollarSign}
          tone="blue"
        />

        <SummaryCard
          title="Custo por Liberado"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoPorLiberado)}
          subtext={'M\u00e9dia geral'}
          icon={BarChart3}
          tone="slate"
        />
        </div>
      </section>

      <div className="space-y-7">
        <CityValuesGrid cidadesData={cidadesData} />
        <CityCostGrid cidadesData={cidadesData} />
      </div>
    </div>
  );
};
