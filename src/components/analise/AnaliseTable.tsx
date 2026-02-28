/**
 * AnaliseTable - Design Elite Enterprise (Stripe-inspired data table)
 */

import React from 'react';
import { AnaliseTableRow } from './AnaliseTableRow';
import type { AnaliseItem } from '@/hooks/analise/useAnaliseTaxas';

interface AnaliseTableProps {
  data: (AnaliseItem & { label: string })[];
  labelColumn: string;
}

export const AnaliseTable = React.memo(function AnaliseTable({
  data,
  labelColumn,
}: AnaliseTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para esta segmentação</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5" style={{ background: 'rgba(22, 31, 48, 0.5)' }}>
            <th className="py-4 pl-6 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{labelColumn}</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horas</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ofertadas</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aceitas</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Rejeitadas</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Completadas</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">% Aceit.</th>
            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">% Rej.</th>
            <th className="py-4 px-4 pr-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">% Comp.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';
