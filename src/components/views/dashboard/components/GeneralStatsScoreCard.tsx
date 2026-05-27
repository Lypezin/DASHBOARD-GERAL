import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Info, TrendingUp } from 'lucide-react';
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

    return (
        <Card className="group relative overflow-hidden border border-slate-200/60 bg-white/90 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:hover:border-slate-700 lg:col-span-4">
            <div
                className="pointer-events-none absolute right-0 top-0 h-72 w-72 -translate-y-1/2 translate-x-1/4 rounded-full opacity-10 blur-3xl transition-opacity duration-500 dark:opacity-5"
                style={{ backgroundImage: `radial-gradient(circle, ${progressColor} 0%, transparent 70%)` }}
            />

            <CardContent className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
                <div className="mb-6 flex w-full items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Aderência Geral</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="rounded-full text-slate-400 transition-colors hover:text-blue-500 focus:outline-none">
                                        <Info className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[220px]">
                                    <p>Índice de eficiência operacional. Relação entre horas realizadas e planejadas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Desempenho consolidado</p>
                    </div>
                    <div className="flex shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2.5 shadow-sm transition-colors duration-300 group-hover:border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 dark:group-hover:border-slate-700">
                        <TrendingUp className="h-5 w-5" style={{ color: progressColor }} />
                    </div>
                </div>

                <div className="relative flex flex-1 items-center justify-center py-3">
                    <CircularProgress
                        value={percentual}
                        size={170}
                        strokeWidth={14}
                        color={progressColor}
                        backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
                        showLabel={true}
                        label="Total"
                    />
                </div>
            </CardContent>
        </Card>
    );
};
