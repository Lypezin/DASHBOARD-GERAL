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
    iconColorClass = "text-slate-400",
    accentColor = "bg-slate-400"
}: ResultadosStatusCardProps) {
    return (
        <div className="relative rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 overflow-hidden">
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        {title}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
                        {value}
                    </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                    <Icon className={`h-5 w-5 ${iconColorClass}`} />
                </div>
            </div>
        </div>
    );
});
