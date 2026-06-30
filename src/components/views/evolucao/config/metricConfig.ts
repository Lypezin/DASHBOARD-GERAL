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
                label: 'Horas trabalhadas',
                data: mapData(d => {
                    const s = d.total_segundos;
                    return segundosParaHoras(typeof s === 'string' ? parseFloat(s) : Number(s) || 0);
                }),
                borderColor: 'rgba(245, 158, 11, 1)',
                pointColor: 'rgb(245, 158, 11)',
                backgroundColor: createGradient('rgba(245, 158, 11,', '252, 211, 77', '217, 119, 6')
            };
        case 'ofertadas':
            return {
                ...common,
                label: 'Corridas ofertadas',
                data: mapData(d => d.corridas_ofertadas ?? d.ofertadas),
                borderColor: 'rgba(6, 182, 212, 1)',
                pointColor: 'rgb(6, 182, 212)',
                backgroundColor: createGradient('rgba(6, 182, 212,', '103, 232, 249', '8, 145, 178')
            };
        case 'aceitas':
            return {
                ...common,
                label: 'Corridas aceitas',
                data: mapData(d => d.corridas_aceitas ?? d.aceitas),
                borderColor: 'rgba(16, 185, 129, 1)',
                pointColor: 'rgb(16, 185, 129)',
                backgroundColor: createGradient('rgba(16, 185, 129,', '52, 211, 153', '5, 150, 105')
            };
        default:
            return {
                ...common,
                label: 'Pedidos',
                data: mapData(d => d.corridas_completadas ?? d.completadas ?? d.total_corridas),
                borderColor: 'rgba(37, 99, 235, 1)',
                pointColor: 'rgb(37, 99, 235)',
                backgroundColor: createGradient('rgba(37, 99, 235,', '59, 130, 246', '30, 64, 175')
            };
    }
};

const createGradient = (baseRgbaPrefix: string, startColor: string, endColor: string) => {
    return (context: any) => {
        const chart = context.chart;
        if (!chart) return `${baseRgbaPrefix} 0.2)`;
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        if (!ctx || !chartArea || chartArea.top == null || chartArea.bottom == null || 
            isNaN(chartArea.top) || isNaN(chartArea.bottom) || 
            !isFinite(chartArea.top) || !isFinite(chartArea.bottom)) {
            return `${baseRgbaPrefix} 0.2)`;
        }
        
        try {
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, `rgba(${startColor}, 0.30)`);
            gradient.addColorStop(0.45, `${baseRgbaPrefix} 0.14)`);
            gradient.addColorStop(1, `rgba(${endColor}, 0.00)`);
            return gradient;
        } catch (e) {
            console.error('Error creating linear gradient in chart:', e);
            return `${baseRgbaPrefix} 0.2)`;
        }
    };
};
