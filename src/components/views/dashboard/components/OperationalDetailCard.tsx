import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { OperationalDetailMetrics } from './OperationalDetailMetrics';

interface DetailData {
    label: string;
    aderencia: number;
    horasAEntregar: number | string;
    horasEntregues: number | string;
    metrics?: {
        ofertadas: number;
        aceitas: number;
        completadas: number;
        rejeitadas: number;
    };
}

interface OperationalDetailCardProps {
    data: DetailData;
}

export const OperationalDetailCard: React.FC<OperationalDetailCardProps> = ({ data }) => {
    const isHighPerf = data.aderencia >= 90;
    const isMidPerf = data.aderencia >= 70;
    const statusColor = isHighPerf
        ? 'text-emerald-700 dark:text-emerald-300'
        : isMidPerf
            ? 'text-[#236b91] dark:text-sky-300'
            : 'text-rose-700 dark:text-rose-300';
    const barColor = isHighPerf ? 'bg-emerald-500' : isMidPerf ? 'bg-sky-600' : 'bg-rose-500';
    const statusLabel = isHighPerf ? 'Acima da meta' : isMidPerf ? 'Em ajuste' : 'Abaixo da meta';
    const progress = Math.min(Math.max(data.aderencia, 0), 100);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <article className="group min-w-0 cursor-help rounded-xl border border-[#d8e4eb] bg-white p-4 transition-colors duration-150 hover:bg-[#f8fbfc] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                    <header className="flex min-w-0 items-start justify-between gap-3">
                        <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={data.label}>
                            {data.label}
                        </h3>
                        <span className={cn('shrink-0 font-mono text-sm font-semibold tabular-nums', statusColor)}>
                            {data.aderencia.toFixed(1)}%
                        </span>
                    </header>

                    <div className="mt-2.5">
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
                            <span className="text-slate-500 dark:text-slate-400">Aderência</span>
                            <span className={cn('font-medium', statusColor)}>{statusLabel}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={`Aderência de ${data.label}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                            <div className={cn('h-full rounded-full transition-[width] duration-200', barColor)} style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="mt-3">
                        <OperationalDetailMetrics
                            horasAEntregar={data.horasAEntregar}
                            horasEntregues={data.horasEntregues}
                            statusColor={statusColor}
                        />
                    </div>

                    {data.metrics ? (
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#e2ebf0] pt-3 dark:border-slate-800 sm:grid-cols-4">
                            <MetricCount label="Ofertadas" value={data.metrics.ofertadas} />
                            <MetricCount label="Aceitas" value={data.metrics.aceitas} tone="blue" />
                            <MetricCount label="Completadas" value={data.metrics.completadas} tone="green" />
                            <MetricCount label="Rejeitadas" value={data.metrics.rejeitadas} tone="red" />
                        </dl>
                    ) : null}
                </article>
            </TooltipTrigger>
            <TooltipContent side="top" className="border-slate-800 bg-slate-900 p-3 text-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-2">
                    <p className="mb-2 border-b border-slate-700 pb-1 text-xs font-semibold text-slate-300">Métricas de corridas</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between gap-2"><span className="text-slate-300">Ofertadas:</span><span className="font-mono font-semibold">{data.metrics?.ofertadas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-emerald-300">Aceitas:</span><span className="font-mono font-semibold">{data.metrics?.aceitas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-sky-300">Completadas:</span><span className="font-mono font-semibold">{data.metrics?.completadas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-rose-300">Rejeitadas:</span><span className="font-mono font-semibold">{data.metrics?.rejeitadas || 0}</span></div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

function MetricCount({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: number;
    tone?: 'default' | 'blue' | 'green' | 'red';
}) {
    const valueClass = {
        default: 'text-slate-800 dark:text-slate-100',
        blue: 'text-[#236b91] dark:text-sky-300',
        green: 'text-emerald-700 dark:text-emerald-300',
        red: 'text-rose-700 dark:text-rose-300',
    }[tone];

    return (
        <div className="min-w-0">
            <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className={cn('mt-0.5 truncate font-mono text-xs font-semibold tabular-nums', valueClass)}>
                {value.toLocaleString('pt-BR')}
            </dd>
        </div>
    );
}
