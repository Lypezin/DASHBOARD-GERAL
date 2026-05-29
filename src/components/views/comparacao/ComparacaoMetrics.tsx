import React from 'react';
import { DashboardResumoData } from '@/types';
import { useComparacaoAggregations } from './hooks/useComparacaoAggregations';
import { VariationBadge } from './components/VariationBadge';

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

    const cardClassName =
        'rounded-[2rem] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.36)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_24px_60px_-38px_rgba(15,23,42,0.28)] dark:border-slate-800/80 dark:bg-slate-950/76 dark:hover:border-slate-700/80';

    return (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardClassName}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Aderencia
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">{aderenciaMedia}%</span>
                    <VariationBadge value={aderenciaVar} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:ring-slate-800">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${aderenciaMedia >= 90 ? 'bg-emerald-500/85' : aderenciaMedia >= 80 ? 'bg-sky-500/85' : aderenciaMedia >= 70 ? 'bg-amber-500/85' : 'bg-rose-500/85'}`}
                        style={{ width: `${Math.min(aderenciaMedia, 100)}%` }}
                    />
                </div>
            </div>

            <div className={cardClassName}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Corridas totais
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">{totalCorridas.toLocaleString('pt-BR')}</span>
                    <VariationBadge value={corridasVar} />
                </div>
                {corridasPorSemana.length > 1 && (
                    <div className="flex w-fit flex-wrap items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-400 tabular-nums dark:bg-slate-900/70 dark:text-slate-500">
                        {corridasPorSemana.map((v, i) => (
                            <React.Fragment key={i}>
                                <span className="text-slate-600 dark:text-slate-300">{v.toLocaleString('pt-BR')}</span>
                                {i < corridasPorSemana.length - 1 && <div className="mx-1 h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            <div className={cardClassName}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Horas realizadas
                </p>
                <span className="mb-2 block font-mono text-3xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">{horasEntregues}</span>
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
                    Tempo total em rota
                </p>
            </div>

            <div className={cardClassName}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Taxa de aceitacao
                </p>
                <span className="mb-2 block text-3xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">{taxaAceitacao}%</span>
                <p className="w-fit rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-400 tabular-nums dark:bg-slate-900/70 dark:text-slate-500">
                    {aceitas.toLocaleString('pt-BR')} / {ofertadas.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
