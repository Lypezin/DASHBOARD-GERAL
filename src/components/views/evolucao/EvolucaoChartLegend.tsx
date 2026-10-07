import React from 'react';

interface EvolucaoChartLegendProps {
    selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
}

const legendItems = {
    horas: { label: 'Horas', dot: 'bg-amber-500' },
    ofertadas: { label: 'Ofertadas', dot: 'bg-cyan-600' },
    aceitas: { label: 'Aceitas', dot: 'bg-emerald-600' },
    completadas: { label: 'Pedidos', dot: 'bg-blue-600' },
};

export const EvolucaoChartLegend: React.FC<EvolucaoChartLegendProps> = ({ selectedMetrics }) => {
    return (
        <div aria-label="Legenda das métricas selecionadas" className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {(['horas', 'ofertadas', 'aceitas', 'completadas'] as const).map((metric) => {
                if (!selectedMetrics.has(metric)) return null;
                const item = legendItems[metric];
                return (
                    <div key={metric} className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className={`h-2 w-2 rounded-full ${item.dot}`} aria-hidden="true" />
                        {item.label}
                    </div>
                );
            })}
        </div>
    );
};
