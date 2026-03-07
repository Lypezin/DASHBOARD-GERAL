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
        <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl group relative overflow-hidden">
            <div className={`absolute right-0 top-0 w-48 h-48 rounded-full -mr-16 -mt-16 blur-[60px] opacity-40 group-hover:opacity-70 transition-opacity duration-700 ${bgGlowColor} pointer-events-none`}></div>
            <CardContent className="p-8 flex items-start justify-between relative z-10 hover:translate-y-[-2px] transition-transform duration-300">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className={`text-slate-300 hover:${iconColor.replace('text-', 'text-').replace('-600', '-500')} transition-colors focus:outline-none`}>
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <h4 className={`text-4xl font-bold font-mono tracking-tight ${statusColor}`}>
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
                <div className={`p-4 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon className={`w-8 h-8 ${iconColor}`} />
                </div>
            </CardContent>
        </Card>
    );
});
