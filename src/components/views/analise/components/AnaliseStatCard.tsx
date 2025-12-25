
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnaliseStatCardProps {
    title: string;
    icon: any;
    value: string;
    subtext?: string;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
    progress?: { value: number; color: string };
}

export const AnaliseStatCard = ({
    title,
    icon: Icon,
    value,
    subtext,
    colorClass,
    bgClass,
    iconBgClass,
    progress
}: AnaliseStatCardProps) => (
    <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>


        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="z-10 relative">
            <div className={`text-2xl font-bold tracking-tight mb-1 ${colorClass} font-mono`}>
                {value}
            </div>
            {subtext && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {subtext}
                </p>
            )}
            {progress && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 flex-1 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                        <div className={`h-full ${progress.color} rounded-full`} style={{ width: `${progress.value}%` }}></div>
                    </div>
                    <span className={`text-xs font-medium ${colorClass}`}>{progress.value.toFixed(1)}%</span>
                </div>
            )}
        </CardContent>
    </Card>
);
