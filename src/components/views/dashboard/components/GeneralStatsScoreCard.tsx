
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
        <Card className="lg:col-span-4 border-none shadow-xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden relative group ringing-1 ring-slate-100 dark:ring-slate-800">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
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

                <div className="relative scale-110 mb-4 transition-transform duration-500 hover:scale-[1.15]">
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
