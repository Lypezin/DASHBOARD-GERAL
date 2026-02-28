/**
 * Componente genérico de tabela de análise
 * Extraído de src/components/views/AnaliseView.tsx
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
          <tr className="border-b border-slate-200 dark:border-slate-700/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
            <th className="px-6 py-4 font-semibold">
              {labelColumn}
            </th>
            <th className="px-6 py-4 font-semibold">
              Horas Entregues
            </th>
            <th className="px-6 py-4 font-semibold">
              Ofertadas
            </th>
            <th className="px-6 py-4 font-semibold">
              Aceitas
            </th>
            <th className="px-6 py-4 font-semibold">
              Rejeitadas
            </th>
            <th className="px-6 py-4 font-semibold">
              Completadas
            </th>
            <th className="px-6 py-4 font-semibold">
              % Aceit.
            </th>
            <th className="px-6 py-4 font-semibold">
              % Rej.
            </th>
            <th className="px-6 py-4 font-semibold">
              % Comp.
            </th>
          </tr>
        </thead>
        <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';
