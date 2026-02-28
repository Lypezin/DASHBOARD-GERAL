/**
 * Componente para linha de tabela de análise - Design Stitch MCP
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
    <tr
      className="hover:bg-white/[0.03] transition-colors group"
      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <td className="px-6 py-4 font-medium text-white">
        {item.label}
      </td>
      <td className="px-6 py-4 font-mono text-slate-400">
        {item.horas_entregues || '00:00:00'}
      </td>
      <td className="px-6 py-4 text-slate-300">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-emerald-400">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-rose-400">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-violet-400 font-medium">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {taxas.taxaAceitacao.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {taxas.taxaRejeicao.toFixed(1)}%
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
          {taxas.taxaCompletude.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});

AnaliseTableRow.displayName = 'AnaliseTableRow';
