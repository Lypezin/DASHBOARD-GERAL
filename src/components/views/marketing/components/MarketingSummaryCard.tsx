
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
    <Card className={`border-none shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgClass} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500`} />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${iconBgClass} transition-colors duration-300 group-hover:bg-opacity-80`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="z-10 relative">
            <div className={`text-2xl font-bold tracking-tight mb-4 ${colorClass}`}>
                {value}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Operacional</span>
                    <div className="flex items-end gap-1.5 h-full">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{opsValue}</span>
                        {opsPercent && <span className="text-[10px] text-slate-400 font-medium mb-0.5">{opsPercent}</span>}
                    </div>
                </div>
                <div className="flex flex-col space-y-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-[10px] uppercase font-semibold text-purple-500/80">Marketing</span>
                    <div className="flex items-end gap-1.5 h-full">
                        <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm">{mktValue}</span>
                        {mktPercent && <span className="text-[10px] text-purple-500/70 font-medium mb-0.5">{mktPercent}</span>}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);
