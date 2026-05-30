import React from 'react';

interface EvolucaoChartLegendProps {
    selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
}

const legendItems = {
    horas: { label: 'Horas', dot: 'bg-amber-500', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300' },
    ofertadas: { label: 'Ofertadas', dot: 'bg-cyan-500', className: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/25 dark:text-cyan-300' },
    aceitas: { label: 'Aceitas', dot: 'bg-emerald-500', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300' },
    completadas: { label: 'Completadas', dot: 'bg-blue-500', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-300' },
};

export const EvolucaoChartLegend: React.FC<EvolucaoChartLegendProps> = ({ selectedMetrics }) => {
    return (
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {(['horas', 'ofertadas', 'aceitas', 'completadas'] as const).map((metric) => {
                if (!selectedMetrics.has(metric)) return null;
                const item = legendItems[metric];
                return (
                    <div key={metric} className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-bold ${item.className}`}>
                        <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                        {item.label}
                    </div>
                );
            })}
        </div>
    );
};
