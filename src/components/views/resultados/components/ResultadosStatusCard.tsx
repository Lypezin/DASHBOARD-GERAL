import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResultadosStatusCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    iconColorClass?: string;
    accentColor?: string;
}

export const ResultadosStatusCard = React.memo(function ResultadosStatusCard({
    title,
    value,
    icon: Icon,
    iconColorClass = "text-slate-500 dark:text-slate-400",
    accentColor = "bg-slate-400"
}: ResultadosStatusCardProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 transition-all duration-200 hover:shadow-md group">
            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor} rounded-l-xl`} />

            <div className="p-5 pl-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {title}
                        </p>
                        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                            {value}
                        </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800/80 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
                        <Icon className={`h-5 w-5 ${iconColorClass}`} />
                    </div>
                </div>
            </div>
        </div>
    );
});
