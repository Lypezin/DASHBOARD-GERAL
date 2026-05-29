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
        <p className="text-muted-foreground text-sm font-semibold">
          Nenhum dado disponível para esta segmentação
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-auto subtle-scrollbar">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="
            border-b border-border
            bg-muted/30
          ">
            <th className="min-w-[260px] py-3.5 pl-6 pr-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{labelColumn}</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Horas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Ofertadas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Aceitas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Rejeitadas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Completadas</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/80">% Aceit.</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/80">% Rej.</th>
            <th className="whitespace-nowrap py-3.5 pl-4 pr-6 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/80">% Comp.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {data.map((item, index) => (
            <AnaliseTableRow key={index} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AnaliseTable.displayName = 'AnaliseTable';
