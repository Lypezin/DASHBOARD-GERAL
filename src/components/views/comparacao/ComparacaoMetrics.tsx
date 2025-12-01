import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Car, Clock } from 'lucide-react';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  const aderenciaMedia = Number(
    (dadosComparacao.reduce((sum, d) => sum + (d.aderencia_semanal[0]?.aderencia_percentual ?? 0), 0) / dadosComparacao.length).toFixed(1)
  );

  const totalCorridas = dadosComparacao.reduce((sum, d) => sum + (d.total_completadas ?? 0), 0);

  const horasEntregues = formatarHorasParaHMS(
    dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(d.aderencia_semanal[0]?.horas_entregues ?? '0'), 0).toString()
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Aderência Média</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {aderenciaMedia.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Corridas</CardTitle>
          <Car className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalCorridas.toLocaleString('pt-BR')}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Horas Entregues</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {horasEntregues}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
