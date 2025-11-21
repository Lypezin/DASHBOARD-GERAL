'use client';

import React from 'react';
import MarketingCard from '@/components/MarketingCard';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface EntregadoresStatsCardsProps {
  totalEntregadores: number;
  totalSegundos: number;
  formatarSegundosParaHoras: (segundos: number) => string;
}

export const EntregadoresStatsCards = React.memo(function EntregadoresStatsCards({
  totalEntregadores,
  totalSegundos,
  formatarSegundosParaHoras,
}: EntregadoresStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MarketingCard
        title="Total de Entregadores"
        value={totalEntregadores}
        icon="👥"
        color="purple"
      />
      <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/90">
        <div className="absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 blur-3xl transition-opacity group-hover:opacity-25"></div>
        <div className="relative flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3 overflow-hidden">
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">Total de Horas</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white leading-tight break-words" style={{ fontVariantNumeric: 'tabular-nums', wordBreak: 'break-word' }}>
              {formatarSegundosParaHoras(totalSegundos)}
            </p>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg sm:text-xl md:text-2xl text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl">
            ⏱️
          </div>
        </div>
      </div>
    </div>
  );
});

EntregadoresStatsCards.displayName = 'EntregadoresStatsCards';

