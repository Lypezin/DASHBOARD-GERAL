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

  // Reusable Premium Stat Card
  const StatCard = ({
    title,
    icon: Icon,
    value,
    subtext,
    colorClass,
    bgClass,
    iconBgClass,
  }: {
    title: string;
    icon: any;
    value: string;
    subtext?: string;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
  }) => (
    <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
        <Icon className="w-16 h-16" />
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent className="z-10 relative">
        <div className={`text-3xl font-bold tracking-tight mb-1 ${colorClass} font-mono`}>
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        title="Aderência Média"
        icon={CheckCircle2}
        value={`${aderenciaMedia.toFixed(1)}%`}
        subtext="Média de aderência no período"
        colorClass="text-blue-600 dark:text-blue-400"
        bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
        iconBgClass="bg-blue-100 dark:bg-blue-900/40"
      />

      <StatCard
        title="Total de Corridas"
        icon={Car}
        value={totalCorridas.toLocaleString('pt-BR')}
        subtext="Corridas completadas somadas"
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
        iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
      />

      <StatCard
        title="Horas Entregues"
        icon={Clock}
        value={horasEntregues}
        subtext="Total bruto de horas entregues"
        colorClass="text-purple-600 dark:text-purple-400"
        bgClass="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900"
        iconBgClass="bg-purple-100 dark:bg-purple-900/40"
      />
    </div>
  );
};
