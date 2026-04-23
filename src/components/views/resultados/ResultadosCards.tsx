'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Send, CheckCircle2, TrendingUp } from 'lucide-react';
import { AtendenteCard, AtendenteData } from './AtendenteCard';
import { ResultadosStatusCard } from './components/ResultadosStatusCard';

interface ResultadosCardsProps {
  totalEnviado: number;
  totalLiberado: number;
  atendentesData: AtendenteData[];
}

export const ResultadosCards = React.memo(function ResultadosCards({
  totalEnviado,
  totalLiberado,
  atendentesData,
}: ResultadosCardsProps) {
  const taxaConversao = totalEnviado > 0 ? ((totalLiberado / totalEnviado) * 100).toFixed(1) : '0.0';

  return (
    <>
      {/* Cards de Totais - Grid 3 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Total Enviado */}
        <ResultadosStatusCard
          title="Total Enviado"
          value={totalEnviado.toLocaleString('pt-BR')}
          icon={Send}
          iconColorClass="text-emerald-500"
        />

        {/* Card Total Liberado */}
        <ResultadosStatusCard
          title="Total Liberado"
          value={totalLiberado.toLocaleString('pt-BR')}
          icon={CheckCircle2}
          iconColorClass="text-blue-500"
        />

        {/* Card Taxa de Conversão */}
        <ResultadosStatusCard
          title="Taxa de Conversão"
          value={`${taxaConversao}%`}
          icon={TrendingUp}
          iconColorClass="text-purple-500"
        />
      </div>

      {/* Separador Visual */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Resultados por Responsável
        </h3>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Grid de Atendentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {atendentesData.map((atendenteData) => (
          <AtendenteCard key={atendenteData.nome} atendenteData={atendenteData} />
        ))}
      </div>
    </>
  );
});

ResultadosCards.displayName = 'ResultadosCards';
