import React from 'react';
import { Info, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface GeneralStatsScoreCardProps {
    percentual: number;
    progressColor: string;
}

export const GeneralStatsScoreCard: React.FC<GeneralStatsScoreCardProps> = ({ percentual, progressColor }) => {
    const isHighPerf = percentual >= 90;
    const isMidPerf = percentual >= 70;
    const displayColor = progressColor || (isHighPerf ? '#10B981' : isMidPerf ? '#3B82F6' : '#EF4444');
    const statusLabel = isHighPerf ? 'Saudável' : isMidPerf ? 'Em atenção' : 'Crítico';
    const StatusIcon = isHighPerf ? CheckCircle2 : isMidPerf ? TrendingUp : AlertTriangle;
    const statusClass = isHighPerf
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50'
        : isMidPerf
        ? 'bg-blue-50 text-blue-700 ring-blue-200/70 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/50'
        : 'bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/50';

    return (
        <div className="min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 dark:border-t-sky-700 dark:bg-slate-900 sm:px-5">
            <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">Aderência geral</dt>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" aria-label="Sobre aderência geral" className="shrink-0 rounded-sm text-slate-400 transition-colors hover:text-[#236b91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 dark:text-slate-500 dark:hover:text-sky-300">
                                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px] border border-border text-xs">
                            <p>Índice percentual entre horas entregues e horas planejadas.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${statusClass}`}>
                    <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {statusLabel}
                </span>
            </div>

            <dd className="mt-2 text-[#173f5a] dark:text-slate-50">
                <span className="block truncate text-[25px] font-semibold leading-8 tracking-tight tabular-nums" title={`${percentual.toFixed(2)}%`}>
                    {percentual.toFixed(2)}%
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">Horas entregues sobre horas planejadas</span>
            </dd>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Aderência geral" aria-valuenow={Math.min(Math.max(percentual, 0), 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(Math.max(percentual, 0), 100)}%`, backgroundColor: displayColor }} />
            </div>
        </div>
    );
};
