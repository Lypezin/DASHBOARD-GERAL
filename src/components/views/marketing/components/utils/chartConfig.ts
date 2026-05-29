import { CHART_COLORS } from './chart/chartColors';

export const createChartData = (sortedData: any[]) => {
    return {
        labels: sortedData.map(d => d.label),
        datasets: [
            {
                type: 'line' as const,
                label: 'Saldo',
                data: sortedData.map(d => d.saldo),
                borderColor: CHART_COLORS.SALDO.BORDER,
                backgroundColor: CHART_COLORS.SALDO.BACKGROUND,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: CHART_COLORS.SALDO.POINT,
                pointBorderColor: CHART_COLORS.SALDO.POINT_HOVER,
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true,
                order: 0,
                yAxisID: 'y',
            },
            {
                type: 'bar' as const,
                label: 'Entradas',
                data: sortedData.map(d => d.entradas),
                backgroundColor: CHART_COLORS.ENTRADAS.BACKGROUND,
                borderColor: CHART_COLORS.ENTRADAS.BORDER,
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                order: 1,
                yAxisID: 'y',
            },
            {
                type: 'bar' as const,
                label: 'Saídas',
                data: sortedData.map(d => -d.saidas),
                backgroundColor: CHART_COLORS.SAIDAS.BACKGROUND,
                borderColor: CHART_COLORS.SAIDAS.BORDER,
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                order: 1,
                yAxisID: 'y',
            },
        ],
    };
};

// Re-export options builder
export { getChartOptions } from './chart/chartOptions';
