'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AderenciaDia } from '@/types';

interface MonthComparisonCardsProps {
    aderenciaDia: AderenciaDia[];
}

interface ComparisonMetric {
    label: string;
    current: number;
    previous: number;
    format: 'number' | 'percent' | 'hours';
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

function formatDateLabel(days: AderenciaDia[]): string {
    if (days.length === 0) return '';
    const first = days[0].data || days[0].dia || '';
    const last = days[days.length - 1].data || days[days.length - 1].dia || '';
    // Format as DD/MM
    const fmt = (d: string) => {
        if (!d) return '?';
        const parts = d.split('-');
        if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
        return d;
    };
    if (first === last) return fmt(first);
    return `${fmt(first)} – ${fmt(last)}`;
}

export const MonthComparisonCards = React.memo(function MonthComparisonCards({
    aderenciaDia,
}: MonthComparisonCardsProps) {
    const { metrics, currentLabel, previousLabel } = useMemo(() => {
        if (!aderenciaDia || aderenciaDia.length === 0) return { metrics: [], currentLabel: '', previousLabel: '' };

        const midpoint = Math.floor(aderenciaDia.length / 2);
        const previousDays = aderenciaDia.slice(0, midpoint);
        const currentDays = aderenciaDia.slice(midpoint);

        if (currentDays.length === 0 || previousDays.length === 0) return { metrics: [], currentLabel: '', previousLabel: '' };

        const sumField = (arr: AderenciaDia[], field: keyof AderenciaDia): number =>
            arr.reduce((sum, d) => sum + (Number(d[field]) || 0), 0);

        const avgField = (arr: AderenciaDia[], field: keyof AderenciaDia): number => {
            if (arr.length === 0) return 0;
            return sumField(arr, field) / arr.length;
        };

        // Calculate taxa aceitação from raw data (aceitas / ofertadas)
        const calcTaxaAceitacao = (arr: AderenciaDia[]): number => {
            const totalOfertadas = sumField(arr, 'corridas_ofertadas');
            const totalAceitas = sumField(arr, 'corridas_aceitas');
            return totalOfertadas > 0 ? (totalAceitas / totalOfertadas) * 100 : 0;
        };

        const metricsResult: ComparisonMetric[] = [
            {
                label: 'Aderência',
                current: avgField(currentDays, 'aderencia_percentual'),
                previous: avgField(previousDays, 'aderencia_percentual'),
                format: 'percent',
            },
            {
                label: 'Completadas',
                current: sumField(currentDays, 'corridas_completadas'),
                previous: sumField(previousDays, 'corridas_completadas'),
                format: 'number',
            },
            {
                label: 'Ofertadas',
                current: sumField(currentDays, 'corridas_ofertadas'),
                previous: sumField(previousDays, 'corridas_ofertadas'),
                format: 'number',
            },
            {
                label: 'Taxa Aceitação',
                current: calcTaxaAceitacao(currentDays),
                previous: calcTaxaAceitacao(previousDays),
                format: 'percent',
            },
        ];

        return {
            metrics: metricsResult,
            currentLabel: formatDateLabel(currentDays),
            previousLabel: formatDateLabel(previousDays),
        };
    }, [aderenciaDia]);

    if (metrics.length === 0) return null;

    return (
        <div>
            <p className="text-[11px] text-slate-400 mb-2">
                Comparativo: <span className="font-medium text-slate-500">{currentLabel}</span> vs <span className="font-medium text-slate-500">{previousLabel}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map((metric, i) => {
                    const delta = metric.previous !== 0
                        ? ((metric.current - metric.previous) / metric.previous) * 100
                        : 0;
                    const isPositive = delta > 0;
                    const isNeutral = Math.abs(delta) < 0.5;

                    return (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3"
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
                                Antes ({previousLabel}): {formatValue(metric.previous, metric.format)}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});
