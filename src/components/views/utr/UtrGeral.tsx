import React from 'react';
import { Activity, Car, Timer } from 'lucide-react';
import { UtrGeral as UtrGeralType } from '@/types';
import { formatCompactTime, formatarHorasParaHMS } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    const fullTime = formatarHorasParaHMS(data.tempo_horas ?? 0);
    const compactTime = formatCompactTime(fullTime);
    const formattedCorridas = (data.corridas ?? 0).toLocaleString('pt-BR');

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <UtrMetricCard
                title="UTR Consolidada"
                subtitle="Média do período"
                value={(data.utr ?? 0).toFixed(2)}
                suffix="índice"
                icon={Activity}
                tone="blue"
            />

            <UtrMetricCard
                title="Tempo Total"
                subtitle="Horas operacionais"
                value={compactTime}
                meta={fullTime}
                icon={Timer}
                tone="amber"
            />

            <UtrMetricCard
                title="Total Corridas"
                subtitle="Volume de entregas"
                value={formattedCorridas}
                suffix="entregas"
                icon={Car}
                tone="emerald"
            />
        </div>
    );
});

function UtrMetricCard({
    title,
    subtitle,
    value,
    suffix,
    meta,
    icon: Icon,
    tone,
}: {
    title: string;
    subtitle: string;
    value: string;
    suffix?: string;
    meta?: string;
    icon: React.ElementType;
    tone: 'blue' | 'amber' | 'emerald';
}) {
    const toneClass = {
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    }[tone];

    return (
        <div className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_18px_48px_-38px_rgba(15,23,42,0.38)] dark:border-slate-800/80 dark:bg-slate-950/70 dark:hover:border-slate-700">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{subtitle}</p>
                </div>
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', toneClass)}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="whitespace-nowrap font-mono text-2xl font-black tracking-tight text-slate-950 tabular-nums dark:text-slate-50" title={meta || value}>
                    {value}
                </span>
                {suffix && <span className="text-xs font-semibold text-slate-400">{suffix}</span>}
            </div>
            {meta && <span className="mt-1 block font-mono text-[10px] text-slate-400" title={meta}>{meta}</span>}
        </div>
    );
}

UtrGeral.displayName = 'UtrGeral';
