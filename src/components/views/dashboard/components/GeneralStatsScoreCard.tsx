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

    // Determinar cor e gradientes com base na performance real
    const isHighPerf = percentual >= 90;
    const isMidPerf = percentual >= 70;
    
    const displayColor = isHighPerf ? '#10B981' : isMidPerf ? '#3B82F6' : '#EF4444';

    return (
        <Card className="group relative overflow-hidden border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] lg:col-span-4">
            {/* Efeito de brilho de fundo muito discreto na cor de status */}
            <div
                className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/4 rounded-full opacity-[0.06] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.10] dark:opacity-[0.04]"
                style={{ backgroundImage: `radial-gradient(circle, ${displayColor} 0%, transparent 70%)` }}
            />

            <CardContent className="relative z-10 flex h-full flex-col justify-between p-6">
                {/* Topo do Card */}
                <div className="mb-6 flex w-full items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold text-foreground font-outfit">Aderência Geral</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="rounded-full text-muted-foreground/60 transition-colors hover:text-primary focus:outline-none">
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[220px] font-bold border border-border">
                                    <p>Índice de eficiência operacional. Relação percentual entre horas entregues e planejadas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
                            Desempenho consolidado
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-200 group-hover:border-border/80">
                        <TrendingUp className="h-4.5 w-4.5" style={{ color: displayColor }} />
                    </div>
                </div>

                {/* Gráfico circular de progresso fino e elegante */}
                <div className="relative flex flex-1 items-center justify-center py-2">
                    <CircularProgress
                        value={percentual}
                        size={130}
                        strokeWidth={9}
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
