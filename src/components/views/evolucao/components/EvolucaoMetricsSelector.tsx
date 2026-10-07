import React from 'react';
import { Megaphone, CheckCircle2, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricType = 'ofertadas' | 'aceitas' | 'completadas' | 'horas';

interface EvolucaoMetricsSelectorProps {
    selectedMetrics: Set<MetricType>;
    onMetricsChange: (metrics: Set<MetricType>) => void;
}

const metricConfig: Record<MetricType, { label: string; icon: React.ReactNode }> = {
    ofertadas: {
        label: 'Ofertadas',
        icon: <Megaphone className="h-3.5 w-3.5" />,
    },
    aceitas: {
        label: 'Aceitas',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    completadas: {
        label: 'Pedidos',
        icon: <Target className="h-3.5 w-3.5" />,
    },
    horas: {
        label: 'Horas',
        icon: <Clock className="h-3.5 w-3.5" />,
    },
};

export const EvolucaoMetricsSelector: React.FC<EvolucaoMetricsSelectorProps> = ({
    selectedMetrics,
    onMetricsChange,
}) => {
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Métricas</span>
                <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{selectedMetrics.size} selecionadas</span>
            </div>
            <div role="group" aria-label="Métricas exibidas no gráfico" className="flex flex-wrap gap-2">
                {(['ofertadas', 'aceitas', 'completadas', 'horas'] as const).map(metric => {
                    const item = metricConfig[metric];
                    const isSelected = selectedMetrics.has(metric);

                    return (
                        <button
                            key={metric}
                            aria-pressed={isSelected}
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
                                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-2 motion-reduce:transition-none",
                                isSelected
                                    ? "border-[#b8ccd7] bg-[#eef4f7] text-[#174d70] dark:border-slate-600 dark:bg-slate-800 dark:text-sky-200"
                                    : "border-[#d8e4eb] bg-white text-slate-600 hover:border-[#afc5d1] hover:bg-[#f8fbfc] hover:text-[#183f58] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            <span className={isSelected ? 'text-[#38708e] dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'}>{item.icon}</span>
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
