import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ResultadosStatusCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    iconColorClass?: string;
}

export const ResultadosStatusCard = React.memo(function ResultadosStatusCard({
    title,
    value,
    icon: Icon,
    iconColorClass = "text-slate-500 dark:text-slate-400"
}: ResultadosStatusCardProps) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800/50 backdrop-blur-sm relative overflow-hidden group">
            <div className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {title}
                    </p>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 transition-colors duration-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-700">
                        <Icon className={`h-4 w-4 ${iconColorClass}`} />
                    </div>
                </div>
                <div>
                    <p className="text-3xl font-bold tracking-tight text-slate-700 dark:text-slate-300 mb-1 truncate">
                        {value}
                    </p>
                </div>
            </div>
        </Card>
    );
});
