'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Bike, CheckCircle2, XCircle, PlayCircle, StopCircle, LayoutList } from 'lucide-react';

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
      {/* Total Entregadores */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entregadores</CardTitle>
          <Users className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalEntregadores.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      {/* Total Horas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Horas</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {formatarSegundosParaHoras(totalSegundos)}
          </div>
        </CardContent>
      </Card>

      {/* Ofertadas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Ofertadas</CardTitle>
          <LayoutList className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalOfertadas.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      {/* Aceitas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Aceitas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalAceitas.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      {/* Completadas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Completadas</CardTitle>
          <Bike className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalCompletadas.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      {/* Rejeitadas */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Rejeitadas</CardTitle>
          <XCircle className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalRejeitadas.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      {/* Rodando SIM */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-emerald-50/50 dark:bg-emerald-900/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rodando: SIM</CardTitle>
          <PlayCircle className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            {totalRodandoSim.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      {/* Rodando NÃO */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-rose-50/50 dark:bg-rose-900/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rodando: NÃO</CardTitle>
          <StopCircle className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 font-mono">
            {totalRodandoNao.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

EntregadoresStatsCards.displayName = 'EntregadoresStatsCards';

