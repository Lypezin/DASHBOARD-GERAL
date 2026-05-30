import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { OperationalDetailMetrics } from './OperationalDetailMetrics';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

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
    index?: number;
}

export const OperationalDetailCard: React.FC<OperationalDetailCardProps> = ({ data, index = 0 }) => {
    const isHighPerf = data.aderencia >= 90;
    const isMidPerf = data.aderencia >= 70;

    const statusColor = isHighPerf
        ? 'text-emerald-600 dark:text-emerald-400'
        : isMidPerf
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-rose-600 dark:text-rose-400';

    const barColor = isHighPerf ? 'bg-emerald-500' : isMidPerf ? 'bg-blue-500' : 'bg-rose-500';
    const surfaceColor = isHighPerf
        ? 'bg-emerald-50/75 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-950/25 dark:text-emerald-300 dark:ring-emerald-900/50'
        : isMidPerf
        ? 'bg-blue-50/75 text-blue-700 ring-blue-200/80 dark:bg-blue-950/25 dark:text-blue-300 dark:ring-blue-900/50'
        : 'bg-rose-50/75 text-rose-700 ring-rose-200/80 dark:bg-rose-950/25 dark:text-rose-300 dark:ring-rose-900/50';
    const Icon = isHighPerf || isMidPerf ? TrendingUp : TrendingDown;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Card
                    className={cn(
                        "group relative cursor-help overflow-hidden rounded-2xl border-slate-200/80 bg-white/95 shadow-sm animate-fade-in transition-[border-color,box-shadow,transform] duration-300 dark:border-slate-800/80 dark:bg-slate-950/70",
                        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_54px_-38px_rgba(15,23,42,0.55)] dark:hover:border-slate-700"
                    )}
                    style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
                >
                    <div className={cn("absolute inset-x-0 top-0 h-1", barColor)} />

                    <CardContent className="relative z-10 space-y-4 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-semibold leading-tight text-slate-950 dark:text-slate-50" title={data.label}>
                                        {data.label}
                                    </h3>
                                    <p className="mt-1 text-xs font-medium text-slate-400">
                                        Recorte operacional
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "shrink-0 gap-1.5 rounded-full border-0 px-2.5 py-1 font-mono text-xs font-semibold ring-1",
                                    surfaceColor
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {data.aderencia.toFixed(1)}%
                            </Badge>
                        </div>

                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/50">
                            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400">
                                <span>Progresso de aderencia</span>
                                <span className={statusColor}>{Math.min(data.aderencia, 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-inset ring-slate-200/70 dark:bg-slate-950 dark:ring-slate-700/70">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                                    style={{ width: `${Math.min(data.aderencia, 100)}%` }}
                                />
                            </div>
                        </div>

                        <OperationalDetailMetrics
                            horasAEntregar={data.horasAEntregar}
                            horasEntregues={data.horasEntregues}
                            statusColor={statusColor}
                        />

                        {data.metrics && (
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800 sm:grid-cols-4">
                                <MetricCount label="Ofertadas" value={data.metrics.ofertadas} />
                                <MetricCount label="Aceitas" value={data.metrics.aceitas} tone="blue" />
                                <MetricCount label="Completas" value={data.metrics.completadas} tone="green" />
                                <MetricCount label="Rejeitadas" value={data.metrics.rejeitadas} tone="red" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="border-slate-800 bg-slate-900 p-3 text-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-2">
                    <p className="mb-2 border-b border-slate-700 pb-1 text-xs font-semibold text-slate-400">Metricas de Corrida</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between gap-2"><span className="text-slate-400">Ofertadas:</span><span className="font-mono font-bold">{data.metrics?.ofertadas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-emerald-400">Aceitas:</span><span className="font-mono font-bold">{data.metrics?.aceitas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-blue-400">Completadas:</span><span className="font-mono font-bold">{data.metrics?.completadas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-rose-400">Rejeitadas:</span><span className="font-mono font-bold">{data.metrics?.rejeitadas || 0}</span></div>
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
        default: 'text-slate-950 dark:text-slate-50',
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-rose-600 dark:text-rose-400',
    }[tone];

    return (
        <div className="min-w-0 rounded-xl bg-slate-50/70 px-2.5 py-2 ring-1 ring-slate-200/70 dark:bg-slate-900/50 dark:ring-slate-800/80">
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {label}
            </span>
            <span className={cn("mt-1 block truncate font-mono text-sm font-semibold", valueClass)}>
                {value?.toLocaleString('pt-BR') || 0}
            </span>
        </div>
    );
}
