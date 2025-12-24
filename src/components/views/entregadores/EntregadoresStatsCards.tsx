'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Bike, CheckCircle2, XCircle, PlayCircle, StopCircle, LayoutList } from 'lucide-react';
import { StatCard } from './components/StatCard';

interface EntregadoresStatsCardsProps {
  totalEntregadores: number;
  totalSegundos: number;
  totalOfertadas: number;
  totalAceitas: number;
  totalCompletadas: number;
  totalRejeitadas: number;
  totalRodandoSim: number;
  totalRodandoNao: number;
  formatarSegundosParaHoras: (segundos: number) => string;
}

export const EntregadoresStatsCards = React.memo(function EntregadoresStatsCards({
  totalEntregadores,
  totalSegundos,
  totalOfertadas,
  totalAceitas,
  totalCompletadas,
  totalRejeitadas,
  totalRodandoSim,
  totalRodandoNao,
  formatarSegundosParaHoras,
}: EntregadoresStatsCardsProps) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total de Entregadores"
        icon={Users}
        value={totalEntregadores.toLocaleString('pt-BR')}
        colorClass="text-purple-600 dark:text-purple-400"
        bgClass="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900"
        iconBgClass="bg-purple-100 dark:bg-purple-900/40"
      />

      <StatCard
        title="Total de Horas"
        icon={Clock}
        value={formatarSegundosParaHoras(totalSegundos)}
        colorClass="text-blue-600 dark:text-blue-400"
        bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
        iconBgClass="bg-blue-100 dark:bg-blue-900/40"
      />

      <StatCard
        title="Total Ofertadas"
        icon={LayoutList}
        value={totalOfertadas.toLocaleString('pt-BR')}
        colorClass="text-slate-600 dark:text-slate-400"
        bgClass="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/20 dark:to-slate-900"
        iconBgClass="bg-slate-100 dark:bg-slate-800"
      />

      <StatCard
        title="Total Aceitas"
        icon={CheckCircle2}
        value={totalAceitas.toLocaleString('pt-BR')}
        colorClass="text-cyan-600 dark:text-cyan-400"
        bgClass="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-slate-900"
        iconBgClass="bg-cyan-100 dark:bg-cyan-900/40"
      />

      <StatCard
        title="Total Completadas"
        icon={Bike}
        value={totalCompletadas.toLocaleString('pt-BR')}
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
        iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
      />

      <StatCard
        title="Total Rejeitadas"
        icon={XCircle}
        value={totalRejeitadas.toLocaleString('pt-BR')}
        colorClass="text-rose-600 dark:text-rose-400"
        bgClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900"
        iconBgClass="bg-rose-100 dark:bg-rose-900/40"
      />

      <StatCard
        title="Rodando: SIM"
        icon={PlayCircle}
        value={totalRodandoSim.toLocaleString('pt-BR')}
        colorClass="text-emerald-700 dark:text-emerald-400"
        bgClass="bg-gradient-to-br from-emerald-100 to-white dark:from-emerald-900/30 dark:to-slate-900"
        iconBgClass="bg-emerald-200 dark:bg-emerald-900/50"
      />

      <StatCard
        title="Rodando: NÃO"
        icon={StopCircle}
        value={totalRodandoNao.toLocaleString('pt-BR')}
        colorClass="text-rose-700 dark:text-rose-400"
        bgClass="bg-gradient-to-br from-rose-100 to-white dark:from-rose-900/30 dark:to-slate-900"
        iconBgClass="bg-rose-200 dark:bg-rose-900/50"
      />
    </div>
  );
});

EntregadoresStatsCards.displayName = 'EntregadoresStatsCards';

