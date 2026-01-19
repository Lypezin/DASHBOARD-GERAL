'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Send, CheckCircle2, TrendingUp } from 'lucide-react';
import { AtendenteCard, AtendenteData } from './AtendenteCard';

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
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-700">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-4 -right-4 p-3 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <Send className="w-24 h-24 text-white" />
          </div>
          <div className="p-5 z-10 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100 mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
                  Total Enviado
                </p>
                <p className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-lg">
                  {totalEnviado.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <Send className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </Card>

        {/* Card Total Liberado */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-4 -right-4 p-3 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <CheckCircle2 className="w-24 h-24 text-white" />
          </div>
          <div className="p-5 z-10 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100 mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-200 animate-pulse" />
                  Total Liberado
                </p>
                <p className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-lg">
                  {totalLiberado.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </Card>

        {/* Card Taxa de Conversão */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden relative bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 dark:from-violet-600 dark:via-purple-700 dark:to-fuchsia-700">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-4 -right-4 p-3 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <TrendingUp className="w-24 h-24 text-white" />
          </div>
          <div className="p-5 z-10 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100 mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-200 animate-pulse" />
                  Taxa de Conversão
                </p>
                <p className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-lg">
                  {taxaConversao}%
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </Card>
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
