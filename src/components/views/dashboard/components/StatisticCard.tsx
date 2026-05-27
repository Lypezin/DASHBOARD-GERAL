import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, LucideIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkline } from '@/components/ui/Sparkline';

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
    statusColor = "text-slate-800 dark:text-slate-100",
    badge,
    gradientFrom,
    gradientTo,
    iconColor,
    bgGlowColor,
    sparklineData,
    sparklineColor
}: StatisticCardProps) {
    return (
        <Card className="group relative overflow-hidden border border-slate-200/60 bg-white/85 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:hover:border-slate-700">
            <div className={`pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full -mr-16 -mt-16 opacity-15 transition-opacity duration-300 group-hover:opacity-20 ${bgGlowColor}`}></div>
            <CardContent className="relative z-10 flex items-start justify-between gap-4 p-5 sm:p-6 lg:p-7">
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-sm">{title}</p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="shrink-0 rounded-full text-slate-300 transition-colors hover:text-blue-500 focus:outline-none">
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <h4 className={`break-words font-mono text-2xl font-black tracking-tight sm:text-3xl xl:text-4xl ${statusColor}`}>
                        {value}
                    </h4>
                    <div className="flex items-center gap-2 pt-2">
                        <div className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border ${badge.className}`}>
                            <badge.icon className="w-3 h-3" />
                            <span>{badge.text}</span>
                        </div>
                    </div>
                    {sparklineData && sparklineData.length >= 2 && (
                        <div className="pt-2">
                            <Sparkline
                                data={sparklineData}
                                width={100}
                                height={24}
                                color={sparklineColor || '#3b82f6'}
                                strokeWidth={1.5}
                            />
                        </div>
                    )}
                </div>
                <div className={`shrink-0 rounded-2xl bg-gradient-to-br p-3 shadow-sm sm:p-4 ${gradientFrom} ${gradientTo}`}>
                    <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} />
                </div>
            </CardContent>
        </Card>
    );
});
