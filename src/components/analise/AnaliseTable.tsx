import React from 'react';
import { BarChart3 } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <BarChart3 className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Nenhum dado disponivel para esta segmentacao
        </p>
      </div>
    );
  }

  return (
    <div className="subtle-scrollbar w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-950/60">
      <table className="w-full min-w-[1040px] text-left">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/90 dark:border-slate-800/80 dark:bg-slate-900/80">
            <th className="min-w-[250px] py-3.5 pl-5 pr-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{labelColumn}</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Horas</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ofertadas</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Aceitas</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Rejeitadas</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Completadas</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">% Aceit.</th>
            <th className="whitespace-nowrap px-3 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">% Rej.</th>
            <th className="whitespace-nowrap py-3.5 pl-3 pr-5 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">% Comp.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';
