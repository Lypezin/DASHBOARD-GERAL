'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Send, CheckCircle2 } from 'lucide-react';
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
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Enviado
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                  {totalEnviado.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Send className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Liberado
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                  {totalLiberado.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Separador Visual */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent dark:via-purple-600"></div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
          Resultados por Responsável
          <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent dark:via-purple-600"></div>
      </div>

      {/* Grid de Atendentes - Layout Melhorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {atendentesData.map((atendenteData) => (
          <AtendenteCard key={atendenteData.nome} atendenteData={atendenteData} />
        ))}
      </div>
    </>
  );
});

ResultadosCards.displayName = 'ResultadosCards';

