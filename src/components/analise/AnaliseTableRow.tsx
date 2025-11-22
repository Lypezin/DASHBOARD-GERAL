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
    <tr className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
        {item.label}
      </td>
      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
          {taxas.taxaAceitacao.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100">
          {taxas.taxaRejeicao.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
          {taxas.taxaCompletude.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});

AnaliseTableRow.displayName = 'AnaliseTableRow';

