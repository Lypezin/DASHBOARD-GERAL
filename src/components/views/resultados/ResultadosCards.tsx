'use client';

import React from 'react';
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
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <ResultadosStatusCard
          title="Total Enviado"
          value={totalEnviado.toLocaleString('pt-BR')}
          icon={Send}
          iconColorClass="text-emerald-500"
          accentColor="bg-emerald-500"
        />
        <ResultadosStatusCard
          title="Total Liberado"
          value={totalLiberado.toLocaleString('pt-BR')}
          icon={CheckCircle2}
          iconColorClass="text-blue-500"
          accentColor="bg-blue-500"
        />
        <ResultadosStatusCard
          title="Taxa de Conversão"
          value={`${taxaConversao}%`}
          icon={TrendingUp}
          iconColorClass="text-violet-500"
          accentColor="bg-violet-500"
        />
      </div>

      {/* Section Separator */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
        <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          Por Responsável
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
      </div>

      {/* Atendente Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {atendentesData.map((atendenteData) => (
          <AtendenteCard key={atendenteData.nome} atendenteData={atendenteData} />
        ))}
      </div>
    </div>
  );
});

ResultadosCards.displayName = 'ResultadosCards';
