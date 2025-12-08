import { CHART_CONSTANTS, adjustColorOpacity } from '@/utils/charts';

export const segundosParaHoras = (segundos: number): number => {
    return segundos / 3600;
};

export const getMetricConfig = (
    metric: 'ofertadas' | 'aceitas' | 'completadas' | 'horas',
    baseLabels: string[],
    dadosPorLabel: Map<string, any>
) => {
    const mapData = (getValue: (d: any) => number | null): (number | null)[] => {
        return baseLabels.map(label => {
            const d = dadosPorLabel.get(label);
            if (!d) return null;

            const value = getValue(d);
            if (value == null) return null;

            const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
            return (isNaN(numValue) || !isFinite(numValue)) ? null : numValue;
        });
    };

    const common = { labels: baseLabels, useUtrData: false, yAxisID: 'y' };

    switch (metric) {
        case 'horas':
            return {
                ...common,
                label: '⏱️ Horas Trabalhadas',
                data: mapData(d => {
                    const s = d.total_segundos;
                    return segundosParaHoras(typeof s === 'string' ? parseFloat(s) : Number(s) || 0);
                }),
                borderColor: 'rgba(251, 146, 60, 1)',
                pointColor: 'rgb(251, 146, 60)',
                backgroundColor: createGradient('rgba(251, 146, 60,', '253, 186, 116', '234, 88, 12')
            };
        case 'ofertadas':
            return {
                ...common,
                label: '📢 Corridas Ofertadas',
                data: mapData(d => d.corridas_ofertadas ?? d.ofertadas),
                borderColor: 'rgba(139, 92, 246, 1)',
                pointColor: 'rgb(139, 92, 246)',
                backgroundColor: createGradient('rgba(139, 92, 246,', '167, 139, 250', '124, 58, 237')
            };
        case 'aceitas':
            return {
                ...common,
                label: '✅ Corridas Aceitas',
                data: mapData(d => d.corridas_aceitas ?? d.aceitas),
                borderColor: 'rgba(16, 185, 129, 1)',
                pointColor: 'rgb(16, 185, 129)',
                backgroundColor: createGradient('rgba(16, 185, 129,', '52, 211, 153', '5, 150, 105')
            };
        default: // completadas
            return {
                ...common,
                label: '🚗 Corridas Completadas',
                data: mapData(d => d.corridas_completadas ?? d.completadas ?? d.total_corridas),
                borderColor: 'rgba(37, 99, 235, 1)',
                pointColor: 'rgb(37, 99, 235)',
                backgroundColor: createGradient('rgba(37, 99, 235,', '59, 130, 246', '30, 64, 175')
            };
    }
};

const createGradient = (baseRgbaPrefix: string, startColor: string, endColor: string) => {
    return (context: any) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return `${baseRgbaPrefix} 0.2)`;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `rgba(${startColor}, 0.5)`);
        gradient.addColorStop(0.3, `${baseRgbaPrefix} 0.35)`);
        gradient.addColorStop(0.7, `rgba(${endColor}, 0.15)`);
        gradient.addColorStop(1, `${baseRgbaPrefix} 0.00)`);
        return gradient;
    };
};
