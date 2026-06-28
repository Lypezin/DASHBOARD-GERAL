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

  const metrics = [
    { label: 'Primeira aparição', value: firstSeenLabel, icon: CalendarDays, color: 'text-violet-600' },
    { label: 'Horas online', value: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600), icon: Clock, color: 'text-blue-600' },
    { label: 'Aderência', value: `${entregador.aderencia_percentual.toFixed(1)}%`, icon: Target, color: 'text-emerald-600' },
    { label: 'Ofertadas', value: entregador.corridas_ofertadas.toLocaleString('pt-BR'), icon: Hash, color: 'text-slate-600' },
    { label: 'Aceitas', value: entregador.corridas_aceitas.toLocaleString('pt-BR'), icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Rejeitadas', value: entregador.corridas_rejeitadas.toLocaleString('pt-BR'), icon: XCircle, color: 'text-rose-600' },
    { label: 'Completadas', value: entregador.corridas_completadas.toLocaleString('pt-BR'), icon: Activity, color: 'text-sky-600' },
    { label: '% Aceitação', value: `${percentualAceitas.toFixed(1)}%`, icon: Percent, color: 'text-emerald-600' },
    { label: '% Completude', value: `${percentualCompletadas.toFixed(1)}%`, icon: Percent, color: 'text-blue-600' },
    { label: '% Rejeição', value: `${entregador.rejeicao_percentual.toFixed(1)}%`, icon: Percent, color: 'text-rose-600' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-1 flex items-center gap-2">
            <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{metric.label}</span>
          </div>
          <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100" title={metric.value}>{metric.value}</p>
        </div>
      ))}
    </div>
  );
});
