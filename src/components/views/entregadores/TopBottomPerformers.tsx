'use client';

import React, { useMemo, useState } from 'react';
import { Entregador } from '@/types';
import { AlertTriangle, ChevronDown, Trophy } from 'lucide-react';
import { calculateHealthScore } from '@/components/ui/HealthBadge';
import { SortMetric, metricLabels, getMetricValue, PerformerRow } from './TopBottomPerformerRow';

interface TopBottomPerformersProps {
    entregadores: Entregador[];
}

export const TopBottomPerformers = React.memo(function TopBottomPerformers({
    entregadores,
}: TopBottomPerformersProps) {
    const [metric, setMetric] = useState<SortMetric>('aderencia');

    const { top10, bottom10 } = useMemo(() => {
        if (!entregadores || entregadores.length === 0) {
            return { top10: [], bottom10: [] };
        }

        const sorted = [...entregadores].sort((a, b) => {
            const aValue = getMetricValue(a, metric);
            const bValue = getMetricValue(b, metric);
            return metric === 'rejeicao' ? aValue - bValue : bValue - aValue;
        });

        return {
            top10: sorted.slice(0, 10),
            bottom10: sorted.slice(-10).reverse(),
        };
    }, [entregadores, metric]);

    if (entregadores.length < 5) return null;

    return (
        <div className="space-y-4 rounded-[1.75rem] border border-slate-200/70 bg-white/88 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/82">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                        Destaques da frota
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Compare o melhor e o pior desempenho no filtro atual.
                    </p>
                </div>
                <div className="relative self-start sm:self-auto">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as SortMetric)}
                        className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-sm font-semibold text-slate-700 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-950/60"
                    >
                        {Object.entries(metricLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-white dark:border-emerald-900/40 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                        <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                            Top 10 - {metricLabels[metric]}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {top10.map((entregador, index) => (
                            <PerformerRow
                                key={entregador.id_entregador}
                                e={entregador}
                                metric={metric}
                                rank={index + 1}
                                highlightTop={index < 3}
                                hs={calculateHealthScore(
                                    entregador.aderencia_percentual,
                                    entregador.corridas_completadas,
                                    entregador.corridas_ofertadas,
                                    entregador.total_segundos
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-rose-200/70 bg-white dark:border-rose-900/40 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 dark:border-rose-900/30 dark:bg-rose-950/20">
                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                            Bottom 10 - {metricLabels[metric]}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bottom10.map((entregador, index) => (
                            <PerformerRow
                                key={entregador.id_entregador}
                                e={entregador}
                                metric={metric}
                                rank={entregadores.length - index}
                                hs={calculateHealthScore(
                                    entregador.aderencia_percentual,
                                    entregador.corridas_completadas,
                                    entregador.corridas_ofertadas,
                                    entregador.total_segundos
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

TopBottomPerformers.displayName = 'TopBottomPerformers';
