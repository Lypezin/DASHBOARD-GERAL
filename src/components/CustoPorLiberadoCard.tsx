'use client';

import React from 'react';

interface CustoPorLiberadoCardProps {
  cidade: string;
  custoPorLiberado: number;
  quantidadeLiberados: number;
  valorTotalEnviados: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const CustoPorLiberadoCard: React.FC<CustoPorLiberadoCardProps> = ({
  cidade,
  custoPorLiberado,
  quantidadeLiberados,
  valorTotalEnviados,
  color = 'purple',
}) => {
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

  // Calcular quantos liberados faltam para chegar a R$ 50,00
  // Fórmula: Valor Total / (Quantidade Atual + X) = 50
  // X = (Valor Total - 50 * Quantidade Atual) / 50
  const META_CUSTO = 50;
  let faltamLiberados = 0;
  let jaAtingiuMeta = false;

  if (custoPorLiberado > META_CUSTO && quantidadeLiberados > 0) {
    // Se o custo atual é maior que R$ 50, calcular quantos faltam
    faltamLiberados = Math.ceil((valorTotalEnviados - META_CUSTO * quantidadeLiberados) / META_CUSTO);
    if (faltamLiberados < 0) {
      faltamLiberados = 0;
    }
  } else if (custoPorLiberado <= META_CUSTO && custoPorLiberado > 0) {
    // Se já está abaixo ou igual a R$ 50
    jaAtingiuMeta = true;
  }

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/90">
      <div className={`absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br ${colors.gradient} opacity-10 blur-3xl transition-opacity group-hover:opacity-25`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3 overflow-hidden">
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
              {cidade} - Custo/Liberado
            </p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white leading-tight break-words" style={{ fontVariantNumeric: 'tabular-nums', wordBreak: 'break-word' }}>
              {formatCurrency(custoPorLiberado)}
            </p>
          </div>
          <div className={`flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${colors.gradient} text-lg sm:text-xl md:text-2xl text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl`}>
            📊
          </div>
        </div>

        {/* Informação de quantos faltam */}
        {jaAtingiuMeta ? (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Meta atingida! Custo abaixo de {formatCurrency(META_CUSTO)}
              </p>
            </div>
          </div>
        ) : faltamLiberados > 0 ? (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Faltam <span className="font-bold text-orange-600 dark:text-orange-400">{faltamLiberados}</span> liberados para chegar a {formatCurrency(META_CUSTO)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CustoPorLiberadoCard;

