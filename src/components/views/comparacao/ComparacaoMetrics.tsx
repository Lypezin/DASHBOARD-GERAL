import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  const aderencias = dadosComparacao.map(d => d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0);
  const aderenciaMedia = Number((aderencias.reduce((a, b) => a + b, 0) / (aderencias.length || 1)).toFixed(1));

  const corridasPorSemana = dadosComparacao.map(d => d?.total_completadas ?? 0);
  const totalCorridas = corridasPorSemana.reduce((a, b) => a + b, 0);

  const horasDecimais = dadosComparacao.map(d => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues')));
  const horasTotalDecimal = horasDecimais.reduce((a, b) => a + b, 0);
  const horasEntregues = formatarHorasParaHMS(horasTotalDecimal.toString());

  const ofertadas = dadosComparacao.reduce((sum, d) => sum + (d?.total_ofertadas ?? 0), 0);
  const aceitas = dadosComparacao.reduce((sum, d) => sum + (d?.total_aceitas ?? 0), 0);
  const taxaAceitacao = ofertadas > 0 ? ((aceitas / ofertadas) * 100).toFixed(1) : '0.0';

  // Compute variation between first and last week
  const getVariation = (values: number[]) => {
    if (values.length < 2) return null;
    const first = values[0];
    const last = values[values.length - 1];
    if (first === 0 && last === 0) return 0;
    if (first === 0) return 100;
    return ((last - first) / first) * 100;
  };

  const aderenciaVar = getVariation(aderencias);
  const corridasVar = getVariation(corridasPorSemana);

  const VariationBadge = ({ value }: { value: number | null }) => {
    if (value === null) return null;
    const isUp = value > 0.5;
    const isDown = value < -0.5;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${isUp ? 'text-emerald-600 dark:text-emerald-400' :
          isDown ? 'text-red-600 dark:text-red-400' :
            'text-slate-400'
        }`}>
        {isUp && <TrendingUp className="w-3 h-3" />}
        {isDown && <TrendingDown className="w-3 h-3" />}
        {!isUp && !isDown && <Minus className="w-3 h-3" />}
        {isUp ? '+' : ''}{value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Aderência */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Aderência
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{aderenciaMedia}%</span>
          <VariationBadge value={aderenciaVar} />
        </div>
        {/* Mini inline bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${aderenciaMedia >= 90 ? 'bg-emerald-500' : aderenciaMedia >= 80 ? 'bg-blue-500' : aderenciaMedia >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            style={{ width: `${Math.min(aderenciaMedia, 100)}%` }}
          />
        </div>
      </div>

      {/* Corridas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Corridas
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{totalCorridas.toLocaleString('pt-BR')}</span>
          <VariationBadge value={corridasVar} />
        </div>
        {/* Per-week breakdown */}
        {corridasPorSemana.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {corridasPorSemana.map((v, i) => (
              <React.Fragment key={i}>
                <span className="font-medium text-slate-600 dark:text-slate-300">{v.toLocaleString('pt-BR')}</span>
                {i < corridasPorSemana.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Horas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Horas Entregues
        </p>
        <span className="block text-2xl font-bold text-slate-900 dark:text-white tabular-nums font-mono">{horasEntregues}</span>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          tempo total em rota
        </p>
      </div>

      {/* Taxa de Aceitação */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Taxa Aceitação
        </p>
        <span className="block text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{taxaAceitacao}%</span>
        <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          {aceitas.toLocaleString('pt-BR')} de {ofertadas.toLocaleString('pt-BR')} ofertadas
        </p>
      </div>
    </div>
  );
};
