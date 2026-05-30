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
    const sideBarColor = isHighPerf ? 'bg-emerald-500' : isMidPerf ? 'bg-blue-500' : 'bg-rose-500';
    const Icon = isHighPerf || isMidPerf ? TrendingUp : TrendingDown;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Card
                    className={cn(
                        "group relative cursor-help overflow-hidden rounded-xl border-slate-200/80 bg-white/95 shadow-sm transition-[border-color,box-shadow,transform] duration-200 dark:border-slate-800/80 dark:bg-slate-900/90",
                        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
                    )}
                    style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
                >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", sideBarColor)} />
                    <div className="pointer-events-none absolute right-3 top-3 text-slate-900/[0.035] transition-opacity duration-300 group-hover:opacity-80 dark:text-white/[0.04]">
                        <Icon className="h-20 w-20 -rotate-12" />
                    </div>

                    <CardContent className="relative z-10 space-y-4 p-5 pl-6">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="min-w-0 truncate text-base font-semibold text-slate-950 dark:text-slate-50" title={data.label}>
                                {data.label}
                            </h3>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "shrink-0 rounded-full border-0 px-2.5 py-1 font-mono text-xs font-semibold",
                                    isHighPerf
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : isMidPerf
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                )}
                            >
                                {data.aderencia.toFixed(1)}%
                            </Badge>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                <span>Progresso</span>
                                <span className={statusColor}>{Math.min(data.aderencia, 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
                            <div className="grid grid-cols-2 gap-3 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                                <MetricCount label="Ofertadas" value={data.metrics.ofertadas} />
                                <MetricCount label="Completas" value={data.metrics.completadas} highlight />
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

function MetricCount({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn("min-w-0", highlight ? "text-right" : "")}>
            <span className="block truncate text-[10px] font-medium text-slate-400">
                {label}
            </span>
            <span className={cn("mt-0.5 block font-mono text-sm font-semibold", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-950 dark:text-slate-50")}>
                {value?.toLocaleString('pt-BR') || 0}
            </span>
        </div>
    );
}
