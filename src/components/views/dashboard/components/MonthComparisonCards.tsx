'use client';

import React from 'react';
import { Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useWeekComparison } from '../hooks/useWeekComparison';
import { AderenciaSemanal, CurrentUser } from '@/types';
import type { Filters } from '@/types/filters';
import { cn } from '@/lib/utils';

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
                <p className="text-[11px] font-bold text-muted-foreground/60 mb-2 px-1 uppercase tracking-wider">
                    Carregando comparativo...
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-muted animate-pulse border border-border" />
                    ))}
                </div>
            </div>
        );
    }

    if (!metrics || metrics.length === 0) return null;

    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground/80 mb-2 px-1 uppercase tracking-wider">
                Comparativo: <span className="font-extrabold text-foreground">{currentWeekLabel}</span> vs <span className="font-extrabold text-foreground">{previousWeekLabel}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric) => {
                    const delta = metric.previous !== 0
                        ? ((metric.current - metric.previous) / metric.previous) * 100
                        : 0;
                    const isPositive = delta > 0;
                    const isNeutral = Math.abs(delta) < 0.5;

                    return (
                        <div
                            key={metric.label}
                            className="rounded-xl border border-border p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200 bg-card hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
                        >
                            <p className="text-[10px] font-bold text-muted-foreground/80 mb-1 uppercase tracking-wider">{metric.label}</p>
                            <div className="flex items-end gap-1.5">
                                <span className="text-lg font-black tracking-tight text-foreground font-mono">
                                    {formatValue(metric.current, metric.format)}
                                </span>
                                {!isNeutral && (
                                    <span className={cn(
                                        "flex items-center gap-0.5 text-[11px] font-bold mb-0.5",
                                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {Math.abs(delta).toFixed(1)}%
                                    </span>
                                )}
                                {isNeutral && (
                                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground/60 mb-0.5">
                                        <Minus className="h-3 w-3" />
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/70 font-mono mt-1 pt-1 border-t border-border/40">
                                Antes: {formatValue(metric.previous, metric.format)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

MonthComparisonCards.displayName = 'MonthComparisonCards';
