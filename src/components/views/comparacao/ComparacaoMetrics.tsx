import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { CheckCircle2, Car, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

// Circular Progress Ring component
const ProgressRing = ({ value, size = 80, strokeWidth = 6, color }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-slate-200 dark:stroke-slate-700"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

// Mini bar sparkline
const MiniBar = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className="rounded-sm transition-all duration-500"
          style={{
            width: `${Math.max(100 / Math.max(values.length, 1) - 4, 6)}%`,
            height: `${Math.max((v / max) * 100, 8)}%`,
            backgroundColor: color,
            opacity: i === values.length - 1 ? 1 : 0.4 + (i / values.length) * 0.4,
          }}
        />
      ))}
    </div>
  );
};

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  const aderenciaMedia = Number(
    (dadosComparacao.reduce((sum, d) => sum + (d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0), 0) / (dadosComparacao.length || 1)).toFixed(1)
  );

  const totalCorridas = dadosComparacao.reduce((sum, d) => sum + (d?.total_completadas ?? 0), 0);
  const corridasPorSemana = dadosComparacao.map(d => d?.total_completadas ?? 0);

  const horasTotaisDecimal = dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues')), 0);
  const horasEntregues = formatarHorasParaHMS(horasTotaisDecimal.toString());
  const horasPlanejadasDecimal = dadosComparacao.reduce((sum, d) => sum + converterHorasParaDecimal(getWeeklyHours(d, 'horas_planejadas')), 0);
  const percentualHoras = horasPlanejadasDecimal > 0 ? Math.min((horasTotaisDecimal / horasPlanejadasDecimal) * 100, 100) : 0;

  // Determine trend
  const getTrend = () => {
    if (dadosComparacao.length < 2) return { direction: 'neutral' as const, label: 'Estável' };
    const first = dadosComparacao[0]?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0;
    const last = dadosComparacao[dadosComparacao.length - 1]?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0;
    if (last > first) return { direction: 'up' as const, label: `+${(last - first).toFixed(1)}pp` };
    if (last < first) return { direction: 'down' as const, label: `${(last - first).toFixed(1)}pp` };
    return { direction: 'neutral' as const, label: 'Estável' };
  };
  const trend = getTrend();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Aderência - Circular Progress */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Aderência Média
            </p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums">
              {aderenciaMedia}%
            </p>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold
              ${trend.direction === 'up' ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40' :
                trend.direction === 'down' ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40' :
                  'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'}
            `}>
              {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
              {trend.label}
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <ProgressRing value={aderenciaMedia} size={72} strokeWidth={6} color="#3b82f6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Total Corridas - Sparkline */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total Corridas
              </p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums">
                {totalCorridas.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
              <Car className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          {corridasPorSemana.length > 1 && (
            <MiniBar values={corridasPorSemana} color="#10b981" />
          )}
          {corridasPorSemana.length <= 1 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">Volume total entregue</p>
          )}
        </div>
      </div>

      {/* Horas Totais - Progress Bar */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-2xl" />
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Horas Entregues
              </p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums">
                {horasEntregues}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40">
              <Clock className="w-5 h-5 text-violet-500" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Entregue vs Planejado</span>
              <span className="font-semibold tabular-nums">{percentualHoras.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentualHoras}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
