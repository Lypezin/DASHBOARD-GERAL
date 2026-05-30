import React from 'react';
import { MetricAccentColor } from './metricColors';
import { cn } from '@/lib/utils';

interface AnaliseHeroCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    accentColor: MetricAccentColor;
    progress?: { value: number; label: string };
}

export const AnaliseHeroCard: React.FC<AnaliseHeroCardProps> = ({
    title,
    value,
    icon: Icon,
    accentColor,
    progress
}) => {
    let colorClass = 'text-blue-600 dark:text-blue-400';
    let bgIconClass = 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    let progressFillClass = 'bg-blue-500';

    if (accentColor === 'emerald') {
        colorClass = 'text-emerald-600 dark:text-emerald-400';
        bgIconClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
        progressFillClass = 'bg-emerald-500';
    } else if (accentColor === 'sky') {
        colorClass = 'text-sky-600 dark:text-sky-400';
        bgIconClass = 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400';
        progressFillClass = 'bg-sky-500';
    } else if (accentColor === 'rose') {
        colorClass = 'text-rose-600 dark:text-rose-400';
        bgIconClass = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
        progressFillClass = 'bg-rose-500';
    } else if (accentColor === 'orange') {
        colorClass = 'text-amber-600 dark:text-amber-400';
        bgIconClass = 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
        progressFillClass = 'bg-amber-500';
    }

    return (
        <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_18px_48px_-38px_rgba(15,23,42,0.38)] dark:border-slate-800/80 dark:bg-slate-950/70 dark:hover:border-slate-700">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className={cn('shrink-0 rounded-xl border p-2.5 ring-1 ring-inset', bgIconClass)}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>

            <div className={progress ? 'mb-4 min-w-0 space-y-1' : 'min-w-0 space-y-1'}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:text-xs">
                    {title}
                </p>
                <p className="min-w-0 whitespace-nowrap font-mono text-2xl font-black tracking-tight text-slate-950 tabular-nums dark:text-slate-50" title={value}>
                    {value}
                </p>
            </div>

            {progress && (
                <div className="space-y-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700/70">
                        <div
                            className={cn('h-full rounded-full transition-all duration-1000 ease-out', progressFillClass)}
                            style={{ width: `${Math.min(progress.value, 100)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold sm:text-xs">
                        <span className="truncate uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            {progress.label}
                        </span>
                        <span className={cn('shrink-0 font-mono tabular-nums', colorClass)}>
                            {progress.value.toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
