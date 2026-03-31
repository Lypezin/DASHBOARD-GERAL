import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { useComparacaoAggregations } from './hooks/useComparacaoAggregations';
import { VariationBadge } from './components/VariationBadge';
import { ArrowRight } from 'lucide-react';

interface ComparacaoMetricsProps {
  dadosComparacao: DashboardResumoData[];
}

export const ComparacaoMetrics: React.FC<ComparacaoMetricsProps> = ({
  dadosComparacao,
}) => {
  const {
    aderenciaMedia,
    totalCorridas,
    horasEntregues,
    taxaAceitacao,
    corridasPorSemana,
    aderenciaVar,
    corridasVar,
    ofertadas,
    aceitas
  } = useComparacaoAggregations(dadosComparacao);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Aderência */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-transparent dark:border-slate-800/50">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
          Aderência
        </p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{aderenciaMedia}%</span>
          <VariationBadge value={aderenciaVar} />
        </div>
        <div className="h-2 bg-slate-50 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 ring-1 ring-slate-100 dark:ring-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${aderenciaMedia >= 90 ? 'bg-emerald-500/80' : aderenciaMedia >= 80 ? 'bg-indigo-500/80' : aderenciaMedia >= 70 ? 'bg-orange-500/80' : 'bg-rose-500/80'
              }`}
            style={{ width: `${Math.min(aderenciaMedia, 100)}%` }}
          />
        </div>
      </div>

      {/* Corridas */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-transparent dark:border-slate-800/50">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
          Corridas Total
        </p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{totalCorridas.toLocaleString('pt-BR')}</span>
          <VariationBadge value={corridasVar} />
        </div>
        {corridasPorSemana.length > 1 && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full w-fit">
            {corridasPorSemana.map((v, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-600 dark:text-slate-300">{v.toLocaleString('pt-BR')}</span>
                {i < corridasPorSemana.length - 1 && <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Horas */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-transparent dark:border-slate-800/50">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
          Horas Realizadas
        </p>
        <span className="block text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums font-mono mb-2">{horasEntregues}</span>
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
          Tempo total em rota
        </p>
      </div>

      {/* Taxaceitação */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-transparent dark:border-slate-800/50">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
          Taxa Aceitação
        </p>
        <span className="block text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums mb-2">{taxaAceitacao}%</span>
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full w-fit">
          {aceitas.toLocaleString('pt-BR')} / {ofertadas.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
};
