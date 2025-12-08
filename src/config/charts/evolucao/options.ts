import { evolucaoTooltip } from './tooltips';
import { evolucaoScales } from './scales';

export const createEvolucaoChartOptions = (
    isSemanal: boolean,
    isDarkMode: boolean,
    selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>,
    yAxisRange: { min?: number; max?: number }
) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
        padding: { top: 12, right: 16, bottom: isSemanal ? 80 : 20, left: 12 },
    },
    animation: {
        duration: 300,
        easing: 'easeOutCubic' as const,
        delay: 0,
        ...(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : {}),
    },
    interaction: { mode: 'index' as const, intersect: false, axis: 'x' as const },
    onHover: (event: any, activeElements: any[]) => {
        event.native.target.style.cursor = activeElements && activeElements.length > 0 ? 'pointer' : 'default';
    },
    plugins: {
        legend: {
            position: 'top' as const,
            align: 'center' as const,
            display: true,
            labels: {
                font: { size: 14, weight: 'bold' as const, family: "'Inter', 'system-ui', sans-serif" },
                padding: 16,
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 14,
                boxHeight: 14,
                color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
                generateLabels: (chart: any) => chart.data.datasets.map((dataset: any, i: number) => ({
                    text: dataset.label,
                    fillStyle: dataset.borderColor || dataset.backgroundColor || 'rgb(59, 130, 246)',
                    strokeStyle: dataset.borderColor || 'rgb(59, 130, 246)',
                    lineWidth: dataset.borderWidth || 3,
                    hidden: dataset.hidden || !chart.isDatasetVisible(i),
                    index: i,
                    pointStyle: 'circle',
                    fontColor: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
                })),
                onClick: (e: any, legendItem: any, legend: any) => {
                    const index = legendItem.datasetIndex;
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(index);
                    meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                    chart.update();
                },
            },
        },
        tooltip: evolucaoTooltip(isSemanal, isDarkMode),
    },
    scales: evolucaoScales(isSemanal, isDarkMode, selectedMetrics, yAxisRange),
    elements: {
        line: { borderCapStyle: 'round' as const, borderJoinStyle: 'round' as const },
        point: { hoverBorderWidth: 4, radius: isSemanal ? 4 : 6, hoverRadius: isSemanal ? 8 : 10 },
    },
});
