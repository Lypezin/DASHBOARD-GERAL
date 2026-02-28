/**
 * AnaliseTable - Design Premium inspirado em Stripe/Vercel
 * Data table com header clean, divisores sutis, adaptável light/dark
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
      <div className="text-center py-16">
        <div className="text-5xl mb-4 opacity-40">📊</div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Nenhum dado disponível para esta segmentação
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="
            border-b border-slate-200 dark:border-slate-700/50
            bg-slate-50 dark:bg-slate-800/50
          ">
            <th className="py-3.5 pl-6 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{labelColumn}</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Horas</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ofertadas</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Aceitas</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Rejeitadas</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Completadas</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">% Aceit.</th>
            <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">% Rej.</th>
            <th className="py-3.5 px-4 pr-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">% Comp.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';
