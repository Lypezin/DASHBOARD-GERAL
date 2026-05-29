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
    <Card className="group relative overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-xl dark:bg-slate-900 dark:ring-slate-800">
        <div className={`absolute -mr-10 -mt-10 h-32 w-32 rounded-bl-full ${bgClass} opacity-10 transition-transform duration-500 group-hover:scale-110`} />

        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {title}
            </CardTitle>
            <div className={`rounded-lg p-2 transition-colors duration-300 group-hover:bg-opacity-80 ${iconBgClass}`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="relative z-10">
            <div className={`mb-4 text-2xl font-bold tracking-tight ${colorClass}`}>
                {value}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex h-full flex-col space-y-1 rounded-lg bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Operacional</span>
                    <div className="flex h-full items-end gap-1.5">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{opsValue}</span>
                        {opsPercent && <span className="mb-0.5 text-[10px] font-medium text-slate-400">{opsPercent}</span>}
                    </div>
                </div>
                <div className="flex h-full flex-col space-y-1 rounded-lg bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                    <span className="text-[10px] font-semibold uppercase text-sky-500/80 dark:text-sky-300/80">Marketing</span>
                    <div className="flex h-full items-end gap-1.5">
                        <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">{mktValue}</span>
                        {mktPercent && <span className="mb-0.5 text-[10px] font-medium text-sky-500/70 dark:text-sky-300/70">{mktPercent}</span>}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);
