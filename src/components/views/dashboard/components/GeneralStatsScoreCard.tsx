
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { TrendingUp, Info } from 'lucide-react';
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
        <Card className="lg:col-span-4 border border-slate-200/50 dark:border-slate-800/50 shadow-md bg-gradient-to-br from-white/95 via-white/85 to-slate-50/90 dark:from-slate-900/95 dark:via-slate-900/85 dark:to-slate-950/90 overflow-hidden relative group ring-1 ring-slate-100 dark:ring-slate-800/50 transition-[box-shadow,border-color,background-color] duration-200 hover:shadow-lg">
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 transition-opacity duration-300 pointer-events-none group-hover:opacity-20" style={{ backgroundColor: progressColor }} />
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                <TrendingUp className="w-48 h-48 text-current transform rotate-12" />
            </div>

            <CardContent className="flex flex-col items-center justify-center py-10 relative z-10">
                <div className="text-center mb-6 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Aderência Geral</h3>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none">
                                    <Info className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px]">
                                <p>Índice de eficiência operacional. Relação entre horas realizadas e planejadas.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Desempenho Consolidado</p>
                </div>

                <div className="relative scale-105 mb-4 transition-transform duration-200 hover:scale-[1.08]">
                    <CircularProgress
                        value={percentual}
                        size={180}
                        strokeWidth={12}
                        color={progressColor}
                        backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}
                        showLabel={true}
                        label="Total"
                    />
                </div>
            </CardContent>
        </Card>
    );
};
