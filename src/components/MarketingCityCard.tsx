'use client';

import React from 'react';

interface MarketingCityCardProps {
  cidade: string;
  enviado: number;
  liberado: number;
  rodandoInicio: number;
}

const MarketingCityCard: React.FC<MarketingCityCardProps> = ({
  cidade,
  enviado,
  liberado,
  rodandoInicio,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-purple-300 dark:border-slate-700/50 dark:bg-slate-900/90">
      <div className="absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 blur-3xl transition-opacity group-hover:opacity-25"></div>
      
      <div className="relative">
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate flex-1" title={cidade}>
            {cidade}
          </h3>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50/80 px-3 py-2 dark:bg-emerald-950/30">
            <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 shrink-0">
              Enviado:
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-100 font-mono">
              {enviado.toLocaleString('pt-BR')}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-2 rounded-lg bg-blue-50/80 px-3 py-2 dark:bg-blue-950/30">
            <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 shrink-0">
              Liberado:
            </span>
            <span className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100 font-mono">
              {liberado.toLocaleString('pt-BR')}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-2 rounded-lg bg-purple-50/80 px-3 py-2 dark:bg-purple-950/30">
            <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 shrink-0">
              Rodando Início:
            </span>
            <span className="text-sm sm:text-base font-bold text-purple-900 dark:text-purple-100 font-mono">
              {rodandoInicio.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingCityCard;

