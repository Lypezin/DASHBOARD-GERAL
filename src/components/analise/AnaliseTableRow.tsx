/**
 * Componente para linha de tabela de análise
 * Extraído de src/components/views/AnaliseView.tsx
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
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">
        {item.label}
      </td>
      <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
        {item.horas_entregues || '00:00:00'}
      </td>
      <td className="px-6 py-4">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-rose-600 dark:text-rose-400">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-purple-600 dark:text-purple-400 font-bold">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          {taxas.taxaAceitacao.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          {taxas.taxaRejeicao.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          {taxas.taxaCompletude.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});

AnaliseTableRow.displayName = 'AnaliseTableRow';
