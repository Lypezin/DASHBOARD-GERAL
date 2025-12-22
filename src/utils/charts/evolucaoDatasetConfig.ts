import { CHART_CONSTANTS, adjustColorOpacity } from '@/utils/charts';

/**
 * Cria configuração de dataset para uma métrica específica
 */
export const createMetricDatasetConfig = (
    metric: 'ofertadas' | 'aceitas' | 'completadas' | 'horas',
    index: number,
    isSemanal: boolean,
    config: {
        label: string;
        data: (number | null)[];
        borderColor: string;
        // Chart.js gradient type is complex - using any is acceptable here
        backgroundColor: any;
        pointColor: string;
        yAxisID: string;
    }
) => {
    const borderWidth = CHART_CONSTANTS.BORDER_WIDTHS[index] || 4;
    const pointRadius = isSemanal
        ? (CHART_CONSTANTS.POINT_RADIUS_SEMANAL[index] || 6)
        : (CHART_CONSTANTS.POINT_RADIUS_MENSAL[index] || 9);
    const dashPattern = CHART_CONSTANTS.DASH_PATTERNS[index] || [];
    const opacity = CHART_CONSTANTS.OPACITIES[index] || 1.0;

    const borderColorWithOpacity = adjustColorOpacity(config.borderColor, opacity);
    const pointColorWithOpacity = adjustColorOpacity(config.pointColor, opacity);

    return {
        label: config.label,
        data: config.data,
        borderColor: borderColorWithOpacity,
        backgroundColor: config.backgroundColor,
        yAxisID: config.yAxisID,
        type: 'line' as const,
        tension: 0.4,
        cubicInterpolationMode: 'monotone' as const,
        pointRadius: pointRadius,
        pointHoverRadius: isSemanal ? 12 : 14,
        pointHitRadius: 35,
        pointBackgroundColor: pointColorWithOpacity,
        pointBorderColor: '#fff',
        pointBorderWidth: 4,
        pointHoverBackgroundColor: config.pointColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 6,
        pointStyle: 'circle' as const,
        borderWidth: borderWidth,
        borderDash: dashPattern,
        fill: false,
        spanGaps: false,
        showLine: true,
        hidden: false,
        order: index,
        z: index,
        stack: undefined,
        stepped: false,
        segment: {
            // Chart.js context type is complex - using any is acceptable here
            borderColor: (ctx: any) => {
                if (!ctx.p0 || !ctx.p1) return borderColorWithOpacity;
                return borderColorWithOpacity;
            },
            borderWidth: borderWidth,
            borderDash: dashPattern,
        },
    };
};
