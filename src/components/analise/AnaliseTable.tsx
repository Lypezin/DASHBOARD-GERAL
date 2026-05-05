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
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="
            border-b border-slate-200 dark:border-slate-700/50
            bg-slate-50 dark:bg-slate-800/50
          ">
            <th className="min-w-[260px] py-3.5 pl-6 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{labelColumn}</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Horas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ofertadas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aceitas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rejeitadas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completadas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">% Aceit.</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">% Rej.</th>
            <th className="whitespace-nowrap py-3.5 pl-4 pr-6 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">% Comp.</th>
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
