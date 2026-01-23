/**
 * Componente para linha de tabela de análise
 * Extraído de src/components/views/AnaliseView.tsx
 */

import React from 'react';
import { calcularTaxas, type AnaliseItem } from '@/hooks/analise/useAnaliseTaxas';

interface AnaliseTableRowProps {
  item: AnaliseItem & {
    label: string; // dia_da_semana, periodo, sub_praca, ou origem
  };
}

export const AnaliseTableRow = React.memo(function AnaliseTableRow({
  item,
}: AnaliseTableRowProps) {
  const taxas = calcularTaxas(item);

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-50 dark:border-slate-800/50">
      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
        {item.label}
      </td>
      <td className="px-6 py-4 text-right text-sm font-mono text-slate-600 dark:text-slate-400">
        {item.horas_entregues || '00:00:00'}
      </td>
      <td className="px-6 py-4 text-right text-sm font-mono text-slate-600 dark:text-slate-400">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-right text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-right text-sm font-mono font-medium text-rose-600 dark:text-rose-400">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-right text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {taxas.taxaAceitacao.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          {taxas.taxaRejeicao.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
          {taxas.taxaCompletude.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});

AnaliseTableRow.displayName = 'AnaliseTableRow';

