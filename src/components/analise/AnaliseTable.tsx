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
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700">
          <tr className="border-b-2 border-blue-200 dark:border-slate-600">
            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              {labelColumn}
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              Horas Entregues
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              Corridas Ofertadas
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              Aceitas
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              Rejeitadas
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              Completadas
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              % Aceitação
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              % Rejeição
            </th>
            <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">
              % Completude
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';

