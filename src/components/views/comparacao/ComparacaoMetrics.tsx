import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
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
    dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues')), 0).toString()
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Aderência Média</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
            {aderenciaMedia.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Média de aderência no período
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total de Corridas</CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
            {totalCorridas.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Corridas completadas somadas
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Horas Entregues</CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
            {horasEntregues}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total bruto de horas entregues
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
