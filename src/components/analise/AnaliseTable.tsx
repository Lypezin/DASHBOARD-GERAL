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
      <div className="flex flex-col items-center justify-center border-y border-dashed border-[#d8e4eb] px-6 py-14 text-center dark:border-slate-800">
        <BarChart3 className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Nenhum dado disponível para esta segmentação
        </p>
      </div>
    );
  }

  return (
    <div className="subtle-scrollbar w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left">
        <thead>
          <tr className="border-y border-[#d8e4eb] bg-[#f2f7fa] dark:border-slate-800 dark:bg-slate-800/70">
            <th className="min-w-[250px] py-3 pl-4 pr-4 text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:pl-5">{labelColumn}</th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">Horas</th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">Ofertadas</th>
            <th className="whitespace-nowrap px-3 py-3 text-right text-[11px] font-semibold text-slate-600 dark:text-slate-300">Aceitas</th>
            <th className="whitespace-nowrap px-3 py-3 text-right text-[11px] font-semibold text-slate-600 dark:text-slate-300">Rejeitadas</th>
            <th className="whitespace-nowrap px-3 py-3 text-right text-[11px] font-semibold text-slate-600 dark:text-slate-300">Completadas</th>
            <th className="whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">% Aceit.</th>
            <th className="whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">% Rej.</th>
            <th className="whitespace-nowrap py-3 pl-3 pr-4 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:pr-5">% Comp.</th>
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
