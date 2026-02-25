'use client';

import React, { useMemo, useState } from 'react';
import { AderenciaSubPraca } from '@/types';
import { motion } from 'framer-motion';
import { BarChart3, ChevronDown } from 'lucide-react';

type BenchmarkMetric = 'aderencia' | 'completadas' | 'ofertadas' | 'aceitacao';

const metricLabels: Record<BenchmarkMetric, string> = {
    aderencia: 'Aderência %',
    completadas: 'Completadas',
    ofertadas: 'Ofertadas',
    aceitacao: 'Taxa Aceitação',
};

interface BenchmarkPracasProps {
    subPracas: AderenciaSubPraca[];
}

function getMetric(sp: AderenciaSubPraca, metric: BenchmarkMetric): number {
    switch (metric) {
        case 'aderencia': return sp.aderencia_percentual || 0;
        case 'completadas': return sp.corridas_completadas || 0;
        case 'ofertadas': return sp.corridas_ofertadas || 0;
        case 'aceitacao':
            return (sp.corridas_ofertadas && sp.corridas_ofertadas > 0)
                ? ((sp.corridas_aceitas || 0) / sp.corridas_ofertadas) * 100
                : 0;
    }
}

function formatMetric(val: number, metric: BenchmarkMetric): string {
    if (metric === 'aderencia' || metric === 'aceitacao') return `${val.toFixed(1)}%`;
    return val.toLocaleString('pt-BR');
}

export const BenchmarkPracas = React.memo(function BenchmarkPracas({ subPracas }: BenchmarkPracasProps) {
    const [metric, setMetric] = useState<BenchmarkMetric>('aderencia');

    const ranked = useMemo(() => {
        if (!subPracas || subPracas.length === 0) return [];
        return [...subPracas]
            .filter(sp => sp.sub_praca)
            .sort((a, b) => getMetric(b, metric) - getMetric(a, metric));
    }, [subPracas, metric]);

    if (ranked.length === 0) return null;

    const maxVal = Math.max(...ranked.map(sp => getMetric(sp, metric)), 1);

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Benchmark por Praça</h3>
                </div>
                <div className="relative">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as BenchmarkMetric)}
                        className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 pr-7 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.entries(metricLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
            </div>

            <div className="space-y-2">
                {ranked.map((sp, i) => {
                    const val = getMetric(sp, metric);
                    const widthPct = (val / maxVal) * 100;
                    const isTop3 = i < 3;

                    return (
                        <div key={sp.sub_praca} className="flex items-center gap-3">
                            <span className={`w-5 text-right text-xs font-bold ${isTop3 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {i + 1}
                            </span>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                        {sp.sub_praca}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                        {formatMetric(val, metric)}
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${isTop3 ? 'bg-blue-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPct}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.03 }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
