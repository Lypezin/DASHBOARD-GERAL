import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    icon: any;
    value: string;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    icon: Icon,
    value,
    colorClass,
    bgClass,
    iconBgClass,
}) => (
    <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
            <Icon className="w-16 h-16" />
        </div>

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
            <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent className="z-10 relative">
            <div className={`text-xl font-bold tracking-tight ${colorClass} font-mono`}>
                {value}
            </div>
        </CardContent>
    </Card>
);
