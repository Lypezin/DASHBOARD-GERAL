import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, LucideIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/lib/utils';

interface StatisticCardProps {
    title: string;
    value: string | number;
    tooltipText: string;
    icon: LucideIcon;
    statusColor?: string;
    badge: {
        text: string;
        icon: LucideIcon;
        className: string;
    };
    gradientFrom: string;
    gradientTo: string;
    iconColor: string;
    bgGlowColor: string;
    sparklineData?: number[];
    sparklineColor?: string;
}

export const StatisticCard = React.memo(function StatisticCard({
    title,
    value,
    tooltipText,
    icon: Icon,
    statusColor = "text-foreground",
    badge,
    gradientFrom,
    gradientTo,
    iconColor,
    bgGlowColor,
    sparklineData,
    sparklineColor
}: StatisticCardProps) {
    
    // Determinar a cor de status base para o badge de forma dinâmica e limpa
    const isPositive = badge.className.includes('emerald') || badge.className.includes('success');
    const isNegative = badge.className.includes('rose') || badge.className.includes('destructive') || badge.className.includes('danger');
    
    const badgeColorClass = isPositive 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
      : isNegative 
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      : 'bg-muted text-muted-foreground border-border';

    return (
        <Card className="group relative overflow-hidden border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            {/* Brilho interno discreto ao hover */}
            <div className={`pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full -mr-12 -mt-12 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.08] bg-primary`}></div>
            
            <CardContent className="relative z-10 flex items-start justify-between gap-4 p-6">
                <div className="min-w-0 flex-1 space-y-2">
                    {/* Cabeçalho da Métrica */}
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 sm:text-xs">
                            {title}
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="shrink-0 rounded-full text-muted-foreground/40 transition-colors hover:text-primary focus:outline-none">
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="font-bold border border-border">
                                <p>{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Valor da Métrica - Ajuste Inteligente de Fonte para evitar quebras */}
                    <h4 className={cn(
                      "break-all font-mono font-black tracking-tight leading-none my-1",
                      statusColor,
                      String(value).length > 13
                        ? "text-base sm:text-lg md:text-xl"
                        : String(value).length > 10
                        ? "text-lg sm:text-xl md:text-2xl"
                        : "text-2xl sm:text-3xl"
                    )}>
                        {value}
                    </h4>

                    {/* Indicador de Variação/Badge */}
                    <div className="flex items-center gap-2 pt-1.5">
                        <div className={cn("px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 transition-all shadow-none", badgeColorClass)}>
                            <badge.icon className="w-3.5 h-3.5" />
                            <span>{badge.text}</span>
                        </div>
                    </div>

                    {/* Sparkline Discreto com Base Integrada */}
                    {sparklineData && sparklineData.length >= 2 && (
                        <div className="pt-4.5 opacity-90 transition-opacity group-hover:opacity-100">
                            <Sparkline
                                data={sparklineData}
                                width={140}
                                height={28}
                                color={sparklineColor || '#3B82F6'}
                                strokeWidth={1.5}
                            />
                        </div>
                    )}
                </div>

                {/* Ícone Minimalista envolto em container circular suave */}
                <div className="shrink-0 rounded-xl bg-muted/40 p-3 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors duration-200 group-hover:bg-muted/60">
                    <Icon className={cn("h-5.5 w-5.5", iconColor ? iconColor : "text-muted-foreground")} />
                </div>
            </CardContent>
        </Card>
    );
});

StatisticCard.displayName = 'StatisticCard';
