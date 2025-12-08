import React from 'react';

interface EvolucaoChartLegendProps {
    selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
}

export const EvolucaoChartLegend: React.FC<EvolucaoChartLegendProps> = ({ selectedMetrics }) => {
    return (
        <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {selectedMetrics.has('horas') && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Horas</span>
                </div>
            )}
            {selectedMetrics.has('ofertadas') && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Ofertadas</span>
                </div>
            )}
            {selectedMetrics.has('aceitas') && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Aceitas</span>
                </div>
            )}
            {selectedMetrics.has('completadas') && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Completadas</span>
                </div>
            )}
        </div>
    );
};
