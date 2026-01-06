
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketingSummaryCardProps {
    title: string;
    icon: any;
    value: string;
    opsValue: string;
    mktValue: string;
    opsPercent?: string;
    mktPercent?: string;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
}

export const MarketingSummaryCard = ({
    title,
    icon: Icon,
    value,
    opsValue,
    mktValue,
    opsPercent,
    mktPercent,
    colorClass,
    bgClass,
    iconBgClass
}: MarketingSummaryCardProps) => (
    <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
            <Icon className="w-16 h-16" />
        </div>

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="z-10 relative">
            <div className={`text-2xl font-bold tracking-tight mb-3 ${colorClass}`}>
                {value}
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs bg-white/60 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Ops</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{opsValue}</span>
                        {opsPercent && <span className="text-[10px] text-slate-500 font-medium">({opsPercent})</span>}
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs bg-white/60 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Mkt</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{mktValue}</span>
                        {mktPercent && <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium">({mktPercent})</span>}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);
