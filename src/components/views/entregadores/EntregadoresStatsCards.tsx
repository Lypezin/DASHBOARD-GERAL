'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface EntregadoresStatsCardsProps {
  totalEntregadores: number;
  totalSegundos: number;
  formatarSegundosParaHoras: (segundos: number) => string;
}

export const EntregadoresStatsCards = React.memo(function EntregadoresStatsCards({
  totalEntregadores,
  totalSegundos,
  formatarSegundosParaHoras,
}: EntregadoresStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entregadores</CardTitle>
          <Users className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalEntregadores}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
});

EntregadoresStatsCards.displayName = 'EntregadoresStatsCards';

