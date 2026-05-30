import React from 'react';
import { calcularTaxas, type AnaliseItem } from '@/hooks/analise/useAnaliseTaxas';

interface AnaliseTableRowProps {
  item: AnaliseItem & {
    label: string;
  };
}

export const AnaliseTableRow = React.memo(function AnaliseTableRow({
  item,
}: AnaliseTableRowProps) {
  const taxas = calcularTaxas(item);

  return (
    <tr className="transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-900/55">
      <td className="py-3.5 pl-5 pr-4 text-sm font-semibold text-slate-950 dark:text-slate-50">
        <div className="max-w-[320px] truncate" title={item.label}>
          {item.label}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 font-mono text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {item.horas_entregues || '00:00:00'}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 font-mono text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
        {(item.corridas_aceitas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
        {(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400">
        {(item.corridas_completadas || 0).toLocaleString('pt-BR')}
      </td>
      <RateCell value={taxas.taxaAceitacao} tone="emerald" />
      <RateCell value={taxas.taxaRejeicao} tone="rose" />
      <RateCell value={taxas.taxaCompletude} tone="sky" last />
    </tr>
  );
});

function RateCell({
  value,
  tone,
  last = false,
}: {
  value: number;
  tone: 'emerald' | 'rose' | 'sky';
  last?: boolean;
}) {
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-300',
  }[tone];

  return (
    <td className={`px-3 py-3.5 text-center ${last ? 'pr-5' : ''}`}>
      <span className={`inline-flex min-w-[68px] items-center justify-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums ${toneClass}`}>
        {value.toFixed(1)}%
      </span>
    </td>
  );
}

AnaliseTableRow.displayName = 'AnaliseTableRow';
