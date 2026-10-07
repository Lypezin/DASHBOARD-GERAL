import React from 'react';
import { Activity, Car, CheckCircle2, Clock3 } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { useComparacaoAggregations } from './hooks/useComparacaoAggregations';
import { VariationBadge } from './components/VariationBadge';
import { cn } from '@/lib/utils';

interface ComparacaoMetricsProps {
    dadosComparacao: DashboardResumoData[];
}

export const ComparacaoMetrics = React.memo(function ComparacaoMetrics({
    dadosComparacao,
}: ComparacaoMetricsProps) {
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
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                label="Aderência"
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
                label="Taxa de aceitação"
                value={`${taxaAceitacao}%`}
                icon={CheckCircle2}
                tone="emerald"
                meta={`${aceitas.toLocaleString('pt-BR')} / ${ofertadas.toLocaleString('pt-BR')}`}
            />
        </div>
    );
});

ComparacaoMetrics.displayName = 'ComparacaoMetrics';

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
        <div className="group min-w-0 bg-white p-4 transition-colors duration-150 hover:bg-[#f8fbfc] dark:bg-slate-950/70 dark:hover:bg-slate-900">
            <div className="flex min-w-0 items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', toneClass.icon)}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <p className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                        {label}
                    </p>
                </div>
                {variation}
            </div>
            <p className="mt-3 whitespace-nowrap font-mono text-2xl font-semibold tracking-tight text-[#183f58] tabular-nums dark:text-slate-50" title={value}>
                {value}
            </p>
            {typeof progress === 'number' && (
                <div
                    className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                    role="progressbar"
                    aria-label={`${label}: ${progress}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.max(0, Math.min(progress, 100))}
                >
                    <div
                        className={cn('h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none', toneClass.bar)}
                        style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                    />
                </div>
            )}
            {meta && (
                <p className="mt-2.5 max-w-full truncate text-[11px] text-slate-500 tabular-nums dark:text-slate-400" title={meta}>
                    {meta}
                </p>
            )}
        </div>
    );
}
