'use client';

import React from 'react';
import { Activity, CalendarDays, CheckCircle2, Clock, Hash, Percent, Target, XCircle } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Entregador } from '@/types';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from '../EntregadoresUtils';

interface EntregadorMetricsGridProps {
  entregador: Entregador;
  firstSeenLabel: string;
}

export const EntregadorMetricsGrid = React.memo(function EntregadorMetricsGrid({
  entregador,
  firstSeenLabel,
}: EntregadorMetricsGridProps) {
  const percentualAceitas = calcularPercentualAceitas(entregador);
  const percentualCompletadas = calcularPercentualCompletadas(entregador);

  const highlights = [
    { label: 'Corridas completadas', value: entregador.corridas_completadas.toLocaleString('pt-BR'), icon: Activity, color: 'text-sky-700 dark:text-sky-300', tint: 'bg-sky-100 dark:bg-sky-400/10' },
    { label: 'Aderência', value: `${entregador.aderencia_percentual.toFixed(1)}%`, icon: Target, color: 'text-blue-700 dark:text-blue-300', tint: 'bg-blue-100 dark:bg-blue-400/10' },
    { label: 'Horas online', value: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600), icon: Clock, color: 'text-indigo-700 dark:text-indigo-300', tint: 'bg-indigo-100 dark:bg-indigo-400/10' },
    { label: 'Primeira aparição', value: firstSeenLabel, icon: CalendarDays, color: 'text-slate-600 dark:text-slate-300', tint: 'bg-slate-100 dark:bg-slate-700/60' },
  ];

  const details = [
    { label: 'Ofertadas', value: entregador.corridas_ofertadas.toLocaleString('pt-BR'), icon: Hash, color: 'text-slate-600 dark:text-slate-300' },
    { label: 'Aceitas', value: entregador.corridas_aceitas.toLocaleString('pt-BR'), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-300' },
    { label: 'Rejeitadas', value: entregador.corridas_rejeitadas.toLocaleString('pt-BR'), icon: XCircle, color: 'text-rose-600 dark:text-rose-300' },
    { label: 'Taxa de aceitação', value: `${percentualAceitas.toFixed(1)}%`, icon: Percent, color: 'text-emerald-600 dark:text-emerald-300' },
    { label: 'Taxa de conclusão', value: `${percentualCompletadas.toFixed(1)}%`, icon: Percent, color: 'text-blue-600 dark:text-blue-300' },
    { label: 'Taxa de rejeição', value: `${entregador.rejeicao_percentual.toFixed(1)}%`, icon: Percent, color: 'text-rose-600 dark:text-rose-300' },
  ];

  return (
    <div className="space-y-6 px-5 py-6 sm:px-7">
      <section aria-labelledby="entregador-summary-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 id="entregador-summary-heading" className="text-sm font-bold text-slate-900 dark:text-slate-100">Resumo do período</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Indicadores principais da operação</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {highlights.map((metric) => (
            <div key={metric.label} className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[0.025] dark:border-slate-800 dark:bg-slate-900/70 sm:p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.tint}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">{metric.label}</span>
              </div>
              <p className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100" title={metric.value}>{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="entregador-details-heading">
        <div className="mb-3">
          <h3 id="entregador-details-heading" className="text-sm font-bold text-slate-900 dark:text-slate-100">Detalhamento das corridas</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Volumes e taxas de aceitação, conclusão e rejeição</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 dark:border-slate-800 dark:bg-slate-900/45 sm:grid-cols-3 sm:px-4">
          {details.map((metric) => (
            <div key={metric.label} className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-200/70 py-3 last:border-b-0 dark:border-slate-800 sm:[&:nth-last-child(-n+3)]:border-b-0">
              <span className="flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <metric.icon className={`h-3.5 w-3.5 shrink-0 ${metric.color}`} aria-hidden="true" />
                <span className="truncate">{metric.label}</span>
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">{metric.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});
