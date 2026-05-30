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
    statusColor = "text-slate-950 dark:text-slate-50",
    badge,
    iconColor,
    sparklineData,
    sparklineColor
}: StatisticCardProps) {
    const isPositive = badge.className.includes('emerald') || badge.className.includes('success');
    const isNegative = badge.className.includes('rose') || badge.className.includes('destructive') || badge.className.includes('danger');

    const badgeColorClass = isPositive
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        : isNegative
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';

    const valueString = String(value);
    const valueSizeClass = valueString.length > 13
        ? 'text-lg sm:text-xl'
        : valueString.length > 10
        ? 'text-xl sm:text-2xl'
        : 'text-2xl sm:text-3xl';

    return (
        <Card className="group relative overflow-hidden rounded-xl border-slate-200/80 bg-white/95 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/85">
            <CardContent className="relative z-10 flex min-h-[148px] items-start justify-between gap-4 p-5 sm:p-6">
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="mb-1 flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {title}
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="shrink-0 rounded-full text-slate-400 transition-colors hover:text-blue-600 focus:outline-none dark:text-slate-500 dark:hover:text-blue-400">
                                    <Info className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[240px] border border-border text-xs">
                                <p>{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <h4
                        className={cn(
                            'max-w-full truncate font-mono font-semibold leading-tight',
                            valueSizeClass,
                            statusColor
                        )}
                        title={valueString}
                    >
                        {value}
                    </h4>

                    <div className="flex items-center gap-2">
                        <div className={cn("flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold shadow-none", badgeColorClass)}>
                            <badge.icon className="h-3.5 w-3.5" />
                            <span>{badge.text}</span>
                        </div>
                    </div>

                    {sparklineData && sparklineData.length >= 2 && (
                        <div className="pt-2 opacity-90 transition-opacity group-hover:opacity-100">
                            <Sparkline
                                data={sparklineData}
                                width={132}
                                height={28}
                                color={sparklineColor || '#3B82F6'}
                                strokeWidth={1.5}
                            />
                        </div>
                    )}
                </div>

                <div className="shrink-0 rounded-lg border border-slate-200/70 bg-slate-50 p-3 shadow-sm transition-colors duration-200 group-hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:group-hover:bg-slate-900">
                    <Icon className={cn("h-5 w-5", iconColor ? iconColor : "text-muted-foreground")} />
                </div>
            </CardContent>
        </Card>
    );
});

StatisticCard.displayName = 'StatisticCard';
