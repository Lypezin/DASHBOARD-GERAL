/**
 * Componente genérico de tabela de análise
 * Extraído de src/components/views/AnaliseView.tsx
 */

import React from 'react';
import { AnaliseTableRow } from './AnaliseTableRow';
import type { AnaliseItem } from '@/hooks/analise/useAnaliseTaxas';

interface AnaliseTableProps {
  data: (AnaliseItem & { label: string })[];
  labelColumn: string; // "Dia", "Turno", "Sub Praça", "Origem"
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
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-50/50 dark:bg-slate-800/50">
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {labelColumn}
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Horas Entregues
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ofertadas
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aceitas
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rejeitadas
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completadas
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              % Aceit.
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              % Rej.
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              % Comp.
            </th>
          </tr>
        </thead>
        <tbody className="divide-none">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';

