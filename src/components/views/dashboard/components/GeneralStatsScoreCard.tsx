
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
        <Card className="lg:col-span-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md bg-white dark:bg-slate-900/50 overflow-hidden relative group transition-all duration-300">
            {/* Brilho radial muito sutil ancorado no topo/direito em vez de esfera dura centralizada */}
            <div 
                className="absolute top-0 right-0 w-80 h-80 opacity-10 dark:opacity-5 transition-opacity duration-500 pointer-events-none rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" 
                style={{ backgroundImage: `radial-gradient(circle, ${progressColor} 0%, transparent 70%)` }} 
            />

            <CardContent className="flex flex-col p-6 relative z-10 h-full justify-between">
                <div className="w-full flex items-start justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Aderência Geral</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="text-slate-400 hover:text-blue-500 transition-colors rounded-full focus:outline-none">
                                        <Info className="w-4 h-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px]">
                                    <p>Índice de eficiência operacional. Relação entre horas realizadas e planejadas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Desempenho Consolidado</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-center transition-colors duration-300 group-hover:border-slate-200 dark:group-hover:border-slate-700">
                        <TrendingUp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" style={{ color: progressColor }} />
                    </div>
                </div>

                <div className="relative flex items-center justify-center flex-1 py-4 transition-transform duration-500 ease-out hover:scale-105">
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
