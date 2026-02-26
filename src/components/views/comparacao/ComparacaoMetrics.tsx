import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { CheckCircle2, Car, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

const HeroCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendValue,
  iconColor,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconColor: string;
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 transition-colors duration-200 hover:shadow-md group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${iconColor} group-hover:scale-105 transition-transform duration-200`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
          ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
            trend === 'down' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20' :
              'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'}
        `}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend === 'neutral' && <Minus className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>

    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
      <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
        {value}
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-500">{subtext}</p>
    </div>
  </div>
);

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  const aderenciaMedia = Number(
    (dadosComparacao.reduce((sum, d) => sum + (d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0), 0) / (dadosComparacao.length || 1)).toFixed(1)
  );

  const totalCorridas = dadosComparacao.reduce((sum, d) => sum + (d?.total_completadas ?? 0), 0);

  const horasTotaisDecimal = dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues')), 0);
  const horasEntregues = formatarHorasParaHMS(horasTotaisDecimal.toString());

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HeroCard
        title="Aderência Média"
        value={`${aderenciaMedia}%`}
        subtext="Média do período selecionado"
        icon={CheckCircle2}
        trend="neutral"
        trendValue="Estável"
        iconColor="text-blue-600 dark:text-blue-400"
      />

      <HeroCard
        title="Total Corridas"
        value={totalCorridas.toLocaleString('pt-BR')}
        subtext="Volume total entregue"
        icon={Car}
        trend="up"
        trendValue="Volume"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />

      <HeroCard
        title="Horas Totais"
        value={horasEntregues}
        subtext="Tempo total em rota"
        icon={Clock}
        trend="neutral"
        trendValue="Produtividade"
        iconColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
};
