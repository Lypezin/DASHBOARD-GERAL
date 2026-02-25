'use client';

import React, { useState, useMemo } from 'react';
import { Entregador } from '@/types';
import { Trophy, AlertTriangle, ChevronDown } from 'lucide-react';
import { calculateHealthScore, HealthBadge } from '@/components/ui/HealthBadge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formatarHorasParaHMS } from '@/utils/formatters';

type SortMetric = 'aderencia' | 'completadas' | 'horas' | 'rejeicao';

interface TopBottomPerformersProps {
    entregadores: Entregador[];
}

const metricLabels: Record<SortMetric, string> = {
    aderencia: 'Aderência',
    completadas: 'Completadas',
    horas: 'Horas Online',
    rejeicao: 'Rejeição',
};

function getMetricValue(e: Entregador, metric: SortMetric): number {
    switch (metric) {
        case 'aderencia': return e.aderencia_percentual;
        case 'completadas': return e.corridas_completadas;
        case 'horas': return e.total_segundos;
        case 'rejeicao': return e.rejeicao_percentual;
    }
}

function formatMetric(val: number, metric: SortMetric): string {
    switch (metric) {
        case 'aderencia': return `${val.toFixed(1)}%`;
        case 'completadas': return val.toLocaleString('pt-BR');
        case 'horas': return formatarHorasParaHMS(val / 3600);
        case 'rejeicao': return `${val.toFixed(1)}%`;
    }
}

export const TopBottomPerformers = React.memo(function TopBottomPerformers({
    entregadores,
}: TopBottomPerformersProps) {
    const [metric, setMetric] = useState<SortMetric>('aderencia');

    const { top10, bottom10 } = useMemo(() => {
        if (!entregadores || entregadores.length === 0) return { top10: [], bottom10: [] };

        const sorted = [...entregadores].sort((a, b) => {
            const aVal = getMetricValue(a, metric);
            const bVal = getMetricValue(b, metric);
            return metric === 'rejeicao' ? aVal - bVal : bVal - aVal;
        });

        return {
            top10: sorted.slice(0, 10),
            bottom10: sorted.slice(-10).reverse(),
        };
    }, [entregadores, metric]);

    if (entregadores.length < 5) return null;

    return (
        <TooltipProvider delayDuration={0}>
            <div className="space-y-4">
                {/* Metric selector */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ordenar por:</span>
                    <div className="relative">
                        <select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value as SortMetric)}
                            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(metricLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top 10 */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Top 10 — {metricLabels[metric]}</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {top10.map((e, i) => {
                                const hs = calculateHealthScore(e.aderencia_percentual, e.corridas_completadas, e.corridas_ofertadas, e.total_segundos);
                                return (
                                    <div key={e.id_entregador} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className={`w-5 text-center text-xs font-bold ${i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.nome_entregador}</p>
                                        </div>
                                        <HealthBadge grade={hs.grade} score={hs.score} />
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums w-20 text-right">
                                            {formatMetric(getMetricValue(e, metric), metric)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom 10 */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <div className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">Bottom 10 — {metricLabels[metric]}</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {bottom10.map((e, i) => {
                                const hs = calculateHealthScore(e.aderencia_percentual, e.corridas_completadas, e.corridas_ofertadas, e.total_segundos);
                                return (
                                    <div key={e.id_entregador} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="w-5 text-center text-xs font-bold text-slate-400">
                                            {entregadores.length - i}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.nome_entregador}</p>
                                        </div>
                                        <HealthBadge grade={hs.grade} score={hs.score} />
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums w-20 text-right">
                                            {formatMetric(getMetricValue(e, metric), metric)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
});
