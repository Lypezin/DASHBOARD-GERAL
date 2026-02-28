/**
 * AnaliseTableRow - Design Elite Enterprise (pill badges with colored borders)
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
    <tr className="hover:bg-white/[0.03] transition-colors group cursor-default">
      <td className="py-4 pl-6 pr-4 text-sm font-medium text-white">
        {item.label}
      </td>
      <td className="py-4 px-4 text-sm font-mono text-slate-400">
        {item.horas_entregues || '00:00:00'}
      </td>
      <td className="py-4 px-4 text-sm text-slate-300">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-4 px-4 text-sm font-semibold text-emerald-400 text-right">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-4 px-4 text-sm font-semibold text-rose-400 text-right">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-4 px-4 text-sm font-semibold text-violet-400 text-right">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="py-4 px-4 text-center">
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {taxas.taxaAceitacao.toFixed(1)}%
        </span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {taxas.taxaRejeicao.toFixed(1)}%
        </span>
      </td>
      <td className="py-4 px-4 pr-6 text-center">
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
          {taxas.taxaCompletude.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});

AnaliseTableRow.displayName = 'AnaliseTableRow';
