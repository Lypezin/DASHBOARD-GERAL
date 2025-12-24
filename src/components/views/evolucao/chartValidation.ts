/**
 * Utilities for chart data validation and analysis
 */

export function hasChartData(chartData: { datasets?: any[] }): boolean {
    if (!chartData?.datasets?.length) return false;
    return chartData.datasets.some(dataset =>
        dataset.data && dataset.data.some((val: any) => val != null && val !== 0)
    );
}

export function detectDuplicateMetrics(chartData: { datasets?: any[] }): boolean {
    const datasets = chartData?.datasets || [];

    for (let i = 0; i < datasets.length; i++) {
        for (let j = i + 1; j < datasets.length; j++) {
            const d1 = datasets[i];
            const d2 = datasets[j];
            const values1 = d1.data.filter((v: number | null) => v != null);
            const values2 = d2.data.filter((v: number | null) => v != null);

            if (values1.length === values2.length && values1.length > 0) {
                const allEqual = values1.every((v: number, idx: number) => v === values2[idx]);
                if (allEqual) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function shouldShowChart(
    chartData: { datasets: any[]; labels: any[] },
    chartError: string | null,
    hasData: boolean
): boolean {
    return chartData.datasets.length > 0 && chartData.labels.length > 0 && !chartError && hasData;
}
