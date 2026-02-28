/**
 * Componente genérico de tabela de análise - Design Stitch MCP
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
          <tr
            className="text-xs uppercase tracking-wider text-slate-400 font-semibold"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <th className="px-6 py-4">{labelColumn}</th>
            <th className="px-6 py-4">Horas Entregues</th>
            <th className="px-6 py-4">Ofertadas</th>
            <th className="px-6 py-4">Aceitas</th>
            <th className="px-6 py-4">Rejeitadas</th>
            <th className="px-6 py-4">Completadas</th>
            <th className="px-6 py-4">% Aceit.</th>
            <th className="px-6 py-4">% Rej.</th>
            <th className="px-6 py-4">% Comp.</th>
          </tr>
        </thead>
        <tbody className="text-sm text-slate-200" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';
