import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, LucideIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
    title,
    value,
    tooltipText,
    icon: Icon,
    statusColor = "text-slate-800 dark:text-slate-100",
    badge,
    gradientFrom,
    gradientTo,
    iconColor,
    bgGlowColor
}) => {
    return (
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group relative overflow-hidden">
            <div className={`absolute right-0 top-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity ${bgGlowColor}`}></div>
            <CardContent className="p-8 flex items-start justify-between relative z-10">
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
                </div>
                <div className={`p-4 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon className={`w-8 h-8 ${iconColor}`} />
                </div>
            </CardContent>
        </Card>
    );
};
