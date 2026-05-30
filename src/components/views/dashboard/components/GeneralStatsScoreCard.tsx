import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Info, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from '@/contexts/ThemeContext';

interface GeneralStatsScoreCardProps {
    percentual: number;
    progressColor: string;
}

export const GeneralStatsScoreCard: React.FC<GeneralStatsScoreCardProps> = ({ percentual, progressColor }) => {
    const { theme } = useTheme();

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
        <Card className="group relative overflow-hidden rounded-xl border-slate-200/80 bg-white/95 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/90 lg:col-span-4">
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: displayColor }} />

            <CardContent className="flex h-full min-h-[230px] flex-col justify-between gap-5 p-5 sm:p-6">
                <div className="flex w-full items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">Aderência Geral</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="rounded-full text-slate-400 transition-colors hover:text-blue-600 focus:outline-none dark:text-slate-500 dark:hover:text-blue-400">
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[240px] border border-border text-xs">
                                    <p>Índice percentual entre horas entregues e horas planejadas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Desempenho consolidado
                        </p>
                    </div>
                    <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusLabel}
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <CircularProgress
                        value={percentual}
                        size={148}
                        strokeWidth={10}
                        color={displayColor}
                        backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)"}
                        showLabel={true}
                        label="Total"
                    />
                </div>
            </CardContent>
        </Card>
    );
};
