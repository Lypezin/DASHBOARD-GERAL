import React from 'react';
import { Megaphone, CheckCircle2, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricType = 'ofertadas' | 'aceitas' | 'completadas' | 'horas';

interface EvolucaoMetricsSelectorProps {
    selectedMetrics: Set<MetricType>;
    onMetricsChange: (metrics: Set<MetricType>) => void;
}

const metricConfig: Record<MetricType, { label: string; icon: React.ReactNode; activeClass: string }> = {
    ofertadas: {
        label: 'Ofertadas',
        icon: <Megaphone className="h-3.5 w-3.5" />,
        activeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700 shadow-cyan-500/10 dark:border-cyan-900/60 dark:bg-cyan-950/25 dark:text-cyan-300'
    },
    aceitas: {
        label: 'Aceitas',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        activeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-500/10 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300'
    },
    completadas: {
        label: 'Pedidos',
        icon: <Target className="h-3.5 w-3.5" />,
        activeClass: 'border-blue-200 bg-blue-50 text-blue-700 shadow-blue-500/10 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-300'
    },
    horas: {
        label: 'Horas',
        icon: <Clock className="h-3.5 w-3.5" />,
        activeClass: 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-500/10 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300'
    },
};

export const EvolucaoMetricsSelector: React.FC<EvolucaoMetricsSelectorProps> = ({
    selectedMetrics,
    onMetricsChange,
}) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Métricas</label>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{selectedMetrics.size} ativas</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {(['ofertadas', 'aceitas', 'completadas', 'horas'] as const).map(metric => {
                    const item = metricConfig[metric];
                    const isSelected = selectedMetrics.has(metric);

                    return (
                        <button
                            key={metric}
                            onClick={() => {
                                const newSet = new Set(selectedMetrics);
                                if (isSelected) {
                                    newSet.delete(metric);
                                    if (newSet.size === 0) { newSet.add('ofertadas'); newSet.add('aceitas'); newSet.add('completadas'); newSet.add('horas'); }
                                } else {
                                    newSet.add(metric);
                                }
                                onMetricsChange(newSet);
                            }}
                            type="button"
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-bold shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5",
                                isSelected
                                    ? item.activeClass
                                    : "border-slate-200/80 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
