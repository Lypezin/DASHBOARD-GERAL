'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MarketingStatCardProps {
    title: string;
    icon: LucideIcon;
    value: string | number;
    subtext: string;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
}

export const MarketingStatCard: React.FC<MarketingStatCardProps> = ({
    title,
    icon: Icon,
    value,
    subtext,
    colorClass,
    bgClass,
    iconBgClass
}) => (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${iconBgClass} transition-colors duration-300 group-hover:bg-opacity-80`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="z-10 relative">
            <div className={`text-3xl font-bold tracking-tight ${colorClass} mb-2`}>
                {value}
            </div>
            <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${iconBgClass}`} />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {subtext}
                </p>
            </div>
        </CardContent>
    </Card>
);
