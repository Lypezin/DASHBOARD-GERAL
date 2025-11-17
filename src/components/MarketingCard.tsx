'use client';

import React from 'react';

interface MarketingCardProps {
  title: string;
  value: number;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  formatCurrency?: boolean; // Nova prop para formatação de moeda
}

const MarketingCard: React.FC<MarketingCardProps> = ({
  title,
  value,
  icon,
  color = 'purple',
  formatCurrency = false,
}) => {
  // Função para formatar valor
  const formatValue = (val: number): string => {
    if (formatCurrency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(val);
    }
    return val.toLocaleString('pt-BR');
  };
  const colorClasses: Record<string, { gradient: string; bg: string; text: string }> = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-700 dark:text-blue-300',
    },
    green: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    purple: {
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      text: 'text-purple-700 dark:text-purple-300',
    },
    orange: {
      gradient: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-700 dark:text-orange-300',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/90">
      <div className={`absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br ${colors.gradient} opacity-10 blur-3xl transition-opacity group-hover:opacity-25`}></div>
      
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatValue(value)}
          </p>
        </div>
        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${colors.gradient} text-lg sm:text-xl md:text-2xl text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MarketingCard;

