import React from 'react';
import { Activity, Car, CheckCircle2, Clock3 } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { useComparacaoAggregations } from './hooks/useComparacaoAggregations';
import { VariationBadge } from './components/VariationBadge';
import { cn } from '@/lib/utils';

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                label="Aderencia"
                value={`${aderenciaMedia}%`}
                icon={Activity}
                tone={aderenciaMedia >= 90 ? 'emerald' : aderenciaMedia >= 80 ? 'sky' : aderenciaMedia >= 70 ? 'amber' : 'rose'}
                variation={<VariationBadge value={aderenciaVar} />}
                progress={aderenciaMedia}
            />

            <MetricCard
                label="Corridas totais"
                value={totalCorridas.toLocaleString('pt-BR')}
                icon={Car}
                tone="sky"
                variation={<VariationBadge value={corridasVar} />}
                meta={corridasPorSemana.length > 1 ? corridasPorSemana.map((v) => v.toLocaleString('pt-BR')).join(' / ') : undefined}
            />

            <MetricCard
                label="Horas realizadas"
                value={horasEntregues}
                icon={Clock3}
                tone="amber"
                meta="Tempo total em rota"
            />

            <MetricCard
                label="Taxa de aceitacao"
                value={`${taxaAceitacao}%`}
                icon={CheckCircle2}
                tone="emerald"
                meta={`${aceitas.toLocaleString('pt-BR')} / ${ofertadas.toLocaleString('pt-BR')}`}
            />
        </div>
    );
};

function MetricCard({
    label,
    value,
    icon: Icon,
    tone,
    variation,
    progress,
    meta,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    tone: 'emerald' | 'sky' | 'amber' | 'rose';
    variation?: React.ReactNode;
    progress?: number;
    meta?: string;
}) {
    const toneClass = {
        emerald: {
            icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
            bar: 'bg-emerald-500',
        },
        sky: {
            icon: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400',
            bar: 'bg-sky-500',
        },
        amber: {
            icon: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
            bar: 'bg-amber-500',
        },
        rose: {
            icon: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
            bar: 'bg-rose-500',
        },
    }[tone];

    return (
        <div className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_18px_48px_-38px_rgba(15,23,42,0.38)] dark:border-slate-800/80 dark:bg-slate-950/70 dark:hover:border-slate-700">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                {variation}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {label}
            </p>
            <p className="mt-2 whitespace-nowrap font-mono text-3xl font-black tracking-tight text-slate-950 tabular-nums dark:text-slate-50" title={value}>
                {value}
            </p>
            {typeof progress === 'number' && (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:ring-slate-800">
                    <div
                        className={cn('h-full rounded-full transition-all duration-1000', toneClass.bar)}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
            {meta && (
                <p className="mt-3 w-fit max-w-full truncate rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 tabular-nums dark:bg-slate-900/70 dark:text-slate-400" title={meta}>
                    {meta}
                </p>
            )}
        </div>
    );
}
