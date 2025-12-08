import { CHART_CONSTANTS, adjustColorOpacity } from '@/utils/charts';
import { getMetricConfig } from './metricConfig';

export const createChartData = (
    selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>,
    baseLabels: string[],
    dadosPorLabel: Map<string, any>,
    isSemanal: boolean
) => {
    if (selectedMetrics.size === 0 || baseLabels.length === 0) return { labels: [], datasets: [] };

    const metricConfigs = Array.from(selectedMetrics)
        .map(metric => getMetricConfig(metric, baseLabels, dadosPorLabel))
        .filter(Boolean) as any[];

    if (metricConfigs.length === 0) return { labels: [], datasets: [] };

    let globalMaxValue = 0;
    metricConfigs.forEach(config => {
        if (config.yAxisID === 'y') {
            config.data.forEach((v: number | null) => {
                if (v && v > globalMaxValue) globalMaxValue = v;
            });
        }
    });

    const datasets = metricConfigs.map((config, index) => {
        let data = [...config.data];
        while (data.length < baseLabels.length) data.push(null);
        data = data.slice(0, baseLabels.length);

        // Apply visual offset
        if (data.some(Boolean) && config.yAxisID === 'y' && globalMaxValue > 0 && !config.label.includes('Horas')) {
            const offset = [0, globalMaxValue * 0.025, globalMaxValue * 0.05][index] || 0;
            if (offset > 0) data = data.map(v => (v ? v + offset : v));
        }

        const opacity = CHART_CONSTANTS.OPACITIES[index] || 1.0;
        const width = CHART_CONSTANTS.BORDER_WIDTHS[index] || 4;
        const color = adjustColorOpacity(config.borderColor, opacity);
        const pointColor = adjustColorOpacity(config.pointColor, opacity);

        return {
            ...config,
            data,
            borderColor: color,
            pointBackgroundColor: pointColor,
            borderWidth: width,
            borderDash: CHART_CONSTANTS.DASH_PATTERNS[index] || [],
            tension: 0.4,
            cubicInterpolationMode: 'monotone',
            pointRadius: data.map((v: any) => v != null ? (isSemanal ? 6 : 9) : 0),
            pointHoverRadius: isSemanal ? 12 : 14,
            fill: false,
            spanGaps: true,
            showLine: true,
            order: index,
            z: index
        };
    });

    return { labels: baseLabels, datasets };
};
