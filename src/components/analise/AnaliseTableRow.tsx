/**
 * AnaliseTableRow - Pill badges com bordas coloridas, hover sutil
 * Adaptável light/dark mode perfeitamente
 */

import React from 'react';
import { calcularTaxas, type AnaliseItem } from '@/hooks/analise/useAnaliseTaxas';

interface AnaliseTableRowProps {
  item: AnaliseItem & {
    label: string;
  };
}

export const AnaliseTableRow = React.memo(function AnaliseTableRow({
  item,
}: AnaliseTableRowProps) {
  const taxas = calcularTaxas(item);

  return (
    <tr className="
      hover:bg-slate-50 dark:hover:bg-slate-800/40
      transition-colors duration-150
    ">
      <td className="py-3.5 pl-6 pr-4 text-sm font-medium text-slate-900 dark:text-white">
        {item.label}
      </td>
      <td className="py-3.5 px-4 text-sm font-mono text-slate-500 dark:text-slate-400 tabular-nums">
        {item.horas_entregues || '00:00:00'}
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-3.5 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-3.5 px-4 text-sm font-medium text-rose-600 dark:text-rose-400 text-right tabular-nums">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-3.5 px-4 text-sm font-medium text-violet-600 dark:text-violet-400 text-right tabular-nums">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-3.5 px-4 text-center">
        <span className="
          inline-flex items-center justify-center
          px-2.5 py-0.5 rounded-full text-xs font-semibold
          bg-emerald-50 text-emerald-700 border border-emerald-200
          dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
        ">
          {taxas.taxaAceitacao.toFixed(1)}%
        </span>
      </td>
      <td className="py-3.5 px-4 text-center">
        <span className="
          inline-flex items-center justify-center
          px-2.5 py-0.5 rounded-full text-xs font-semibold
          bg-rose-50 text-rose-700 border border-rose-200
          dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20
        ">
          {taxas.taxaRejeicao.toFixed(1)}%
        </span>
      </td>
      <td className="py-3.5 px-4 pr-6 text-center">
        <span className="
          inline-flex items-center justify-center
          px-2.5 py-0.5 rounded-full text-xs font-semibold
          bg-violet-50 text-violet-700 border border-violet-200
          dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20
        ">
          {taxas.taxaCompletude.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});

AnaliseTableRow.displayName = 'AnaliseTableRow';
