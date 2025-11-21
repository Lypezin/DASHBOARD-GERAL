import React from 'react';

interface VariacaoBadgeProps {
  variacao: number;
  className?: string;
  invertColors?: boolean;
}

export const VariacaoBadge: React.FC<VariacaoBadgeProps> = ({
  variacao,
  className = '',
  invertColors = false,
}) => {
  if (!Number.isFinite(variacao)) {
    return null;
  }

  const isPositive = variacao > 0;
  const isNegative = variacao < 0;

  const positiveClasses = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
  const negativeClasses = 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  const neutralClasses = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const toneClasses = isPositive
    ? invertColors ? negativeClasses : positiveClasses
    : isNegative
    ? invertColors ? positiveClasses : negativeClasses
    : neutralClasses;

  const symbol = isPositive ? '+' : isNegative ? '−' : '±';
  const formatted = Math.abs(variacao).toFixed(1);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses} ${className}`.trim()}
    >
      {`${symbol} ${formatted}%`}
    </span>
  );
};

