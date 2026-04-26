'use client';

import React from 'react';
import { Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useWeekComparison } from '../hooks/useWeekComparison';
import { AderenciaSemanal, CurrentUser } from '@/types';
import type { Filters } from '@/types/filters';

interface MonthComparisonCardsProps {
    aderenciaSemanal: AderenciaSemanal[];
    filters: Filters;
    currentUser: CurrentUser | null;
}

function formatValue(val: number, format: 'number' | 'percent' | 'hours'): string {
    if (format === 'percent') return `${val.toFixed(1)}%`;
    if (format === 'hours') {
        const h = Math.floor(val / 3600);
        const m = Math.floor((val % 3600) / 60);
        return `${h}h${m.toString().padStart(2, '0')}`;
    }
    return val.toLocaleString('pt-BR');
}

export const MonthComparisonCards = React.memo(function MonthComparisonCards({
    aderenciaSemanal,
    filters,
    currentUser
}: MonthComparisonCardsProps) {
    const { metrics, loading, currentWeekLabel, previousWeekLabel } = useWeekComparison({
        aderenciaSemanal,
        filters,
        currentUser
    });

    if (loading) {
        return (
            <div>
                <p className="text-[11px] text-slate-400 mb-2">
                    Carregando comparativo...
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800" />
                    ))}
                </div>
            </div>
        );
    }

    if (!metrics || metrics.length === 0) return null;

    return (
        <div>
            <p className="text-[11px] text-slate-400 mb-2">
                Comparativo: <span className="font-medium text-slate-500 dark:text-slate-300">{currentWeekLabel}</span> vs <span className="font-medium text-slate-500 dark:text-slate-300">{previousWeekLabel}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map((metric) => {
                    const delta = metric.previous !== 0
                        ? ((metric.current - metric.previous) / metric.previous) * 100
                        : 0;
                    const isPositive = delta > 0;
                    const isNeutral = Math.abs(delta) < 0.5;

                    return (
                        <div
                            key={metric.label}
                            className="rounded-xl border border-slate-200/50 p-3 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 group dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/50 supports-[backdrop-filter]:backdrop-blur-sm hover:bg-white/85 dark:hover:bg-slate-900/62 hover:shadow-md hover:ring-1 hover:ring-blue-500/10"
                        >
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">{metric.label}</p>
                            <div className="flex items-end gap-2">
                                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {formatValue(metric.current, metric.format)}
                                </span>
                                {!isNeutral && (
                                    <span className={`flex items-center gap-0.5 text-[11px] font-medium mb-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {Math.abs(delta).toFixed(1)}%
                                    </span>
                                )}
                                {isNeutral && (
                                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-slate-400 mb-0.5">
                                        <Minus className="h-3 w-3" />
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Antes ({previousWeekLabel}): {formatValue(metric.previous, metric.format)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
