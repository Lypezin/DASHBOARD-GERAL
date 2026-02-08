import React from 'react';
import CustoPorLiberadoCard from '@/components/CustoPorLiberadoCard';
import { ValoresCidadePorCidade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, Building2 } from 'lucide-react';
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
      {/* Cartões Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          subtext="Média geral"
          icon={BarChart3}
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900"
          iconBgClass="bg-purple-100 dark:bg-purple-900/40"
        />
      </div>

      {/* Cartões de Cidade */}
      <div className="space-y-8">
        {/* Valores por Cidade */}
        <CityValuesGrid cidadesData={cidadesData} />

        {/* Custo por Liberado por Cidade */}
        <CityCostGrid cidadesData={cidadesData} />
      </div>
    </div>
  );
};

