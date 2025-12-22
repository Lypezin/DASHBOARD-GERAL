import React from 'react';
import { Megaphone, CheckCircle2, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricType = 'ofertadas' | 'aceitas' | 'completadas' | 'horas';

interface EvolucaoMetricsSelectorProps {
    selectedMetrics: Set<MetricType>;
    onMetricsChange: (metrics: Set<MetricType>) => void;
}

export const EvolucaoMetricsSelector: React.FC<EvolucaoMetricsSelectorProps> = ({
    selectedMetrics,
    onMetricsChange,
}) => {
    return (
        <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Métricas:</label>
            <div className="flex flex-wrap gap-2">
                {(['ofertadas', 'aceitas', 'completadas', 'horas'] as const).map(metric => {
                    const config: Record<MetricType, { label: string; icon: React.ReactNode; colorClass: string; activeClass: string }> = {
                        ofertadas: {
                            label: 'Ofertadas',
                            icon: <Megaphone className="h-3.5 w-3.5" />,
                            colorClass: 'text-cyan-600 dark:text-cyan-400',
                            activeClass: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-300'
                        },
                        aceitas: {
                            label: 'Aceitas',
                            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                            colorClass: 'text-emerald-600 dark:text-emerald-400',
                            activeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                        },
                        completadas: {
                            label: 'Completadas',
                            icon: <Target className="h-3.5 w-3.5" />,
                            colorClass: 'text-blue-600 dark:text-blue-400',
                            activeClass: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                        },
                        horas: {
                            label: 'Horas',
                            icon: <Clock className="h-3.5 w-3.5" />,
                            colorClass: 'text-orange-600 dark:text-orange-400',
                            activeClass: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300'
                        },
                    };

                    const item = config[metric];
                    const isSelected = selectedMetrics.has(metric);

                    return (
                        <div
                            key={metric}
                            onClick={() => {
                                const newSet = new Set(selectedMetrics);
                                if (isSelected) {
                                    newSet.delete(metric);
                                    if (newSet.size === 0) newSet.add('completadas');
                                } else {
                                    newSet.add(metric);
                                }
                                onMetricsChange(newSet);
                            }}
                            className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                                isSelected
                                    ? item.activeClass
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
