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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Send className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="p-4 z-10 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Total Enviado
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                    {totalEnviado.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shadow-sm group-hover:shadow-md transition-all">
                <Send className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <CheckCircle2 className="w-16 h-16 text-blue-500" />
          </div>
          <div className="p-4 z-10 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Total Liberado
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                    {totalLiberado.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 shadow-sm group-hover:shadow-md transition-all">
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

