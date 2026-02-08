import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string;
    subtext: string;
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorClass,
    bgClass,
    iconBgClass
}) => (
    <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
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
            <div className={`text-3xl font-bold tracking-tight ${colorClass} mb-2`}>
                {value}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-80">
                {subtext}
            </p>
        </CardContent>
    </Card>
);
