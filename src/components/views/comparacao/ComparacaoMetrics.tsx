import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Car, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  // Cálculos Básicos
  const aderenciaMedia = Number(
    (dadosComparacao.reduce((sum, d) => sum + (d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0), 0) / (dadosComparacao.length || 1)).toFixed(1)
  );

  const totalCorridas = dadosComparacao.reduce((sum, d) => sum + (d?.total_completadas ?? 0), 0);

  const horasTotaisDecimal = dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues')), 0);
  const horasEntregues = formatarHorasParaHMS(horasTotaisDecimal.toString());




  // Componente Hero Card
  const HeroCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    trend, // 'up' | 'down' | 'neutral'
    trendValue,
    colorFrom,
    colorTo,
    iconColor
  }: {
    title: string;
    value: string;
    subtext: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
  }) => (
    <Card className="relative overflow-hidden border-none shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl group transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-[0.03] transition-opacity duration-500`} />

      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/60 transition-colors duration-300
                        ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}
                    `}>
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {trendValue}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
          <div className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
            {value}
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <HeroCard
        title="Aderência Média"
        value={`${aderenciaMedia}%`}
        subtext="Média do período selecionado"
        icon={CheckCircle2}
        trend="neutral"
        trendValue="Estável"
        colorFrom="from-blue-500"
        colorTo="to-indigo-600"
        iconColor="text-blue-600"
      />

      <HeroCard
        title="Total Corridas"
        value={totalCorridas.toLocaleString('pt-BR')}
        subtext="Volume total entregue"
        icon={Car}
        trend="up"
        trendValue="Volume"
        colorFrom="from-emerald-500"
        colorTo="to-teal-600"
        iconColor="text-emerald-600"
      />

      <HeroCard
        title="Horas Totais"
        value={horasEntregues}
        subtext="Tempo total em rota"
        icon={Clock}
        trend="neutral"
        trendValue="Produtividade"
        colorFrom="from-violet-500"
        colorTo="to-purple-600"
        iconColor="text-purple-600"
      />

    </div>
  );
};
