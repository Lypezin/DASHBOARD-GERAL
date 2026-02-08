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
          gradient="from-emerald-500 via-emerald-600 to-teal-600 dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-700"
          textColor="text-emerald-100"
          pulseColor="bg-emerald-200"
        />

        {/* Card Total Liberado */}
        <ResultadosStatusCard
          title="Total Liberado"
          value={totalLiberado.toLocaleString('pt-BR')}
          icon={CheckCircle2}
          gradient="from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700"
          textColor="text-blue-100"
          pulseColor="bg-blue-200"
        />

        {/* Card Taxa de Conversão */}
        <ResultadosStatusCard
          title="Taxa de Conversão"
          value={`${taxaConversao}%`}
          icon={TrendingUp}
          gradient="from-violet-500 via-purple-600 to-fuchsia-600 dark:from-violet-600 dark:via-purple-700 dark:to-fuchsia-700"
          textColor="text-purple-100"
          pulseColor="bg-purple-200"
        />
      </div>

      {/* Separador Visual Premium */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent dark:via-purple-500/30" />
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-purple-800/30">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Resultados por Responsável
          </h3>
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent dark:via-purple-500/30" />
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
