export const createComparacaoChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
        mode: 'index' as const,
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                font: { size: 13, weight: 'bold' as const },
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle',
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 15,
            titleFont: { size: 15, weight: 'bold' as const },
            bodyFont: { size: 14 },
            bodySpacing: 8,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
                label: (context: any) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;

                    if (label === 'Aderência (%)') {
                        return `  ${label}: ${value.toFixed(1)}%`;
                    }
                    return `  ${label}: ${value.toLocaleString('pt-BR')} corridas`;
                }
            }
        }
    },
    scales: {
        'y-count': {
            type: 'linear' as const,
            position: 'left' as const,
            beginAtZero: true,
            title: {
                display: true,
                text: 'Quantidade de Corridas',
                font: { size: 13, weight: 'bold' as const },
                color: 'rgb(100, 116, 139)',
            },
            ticks: {
                callback: (value: any) => value.toLocaleString('pt-BR'),
                font: { size: 12 },
                color: 'rgb(100, 116, 139)',
            },
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
            }
        },
        'y-percent': {
            type: 'linear' as const,
            position: 'right' as const,
            beginAtZero: true,
            max: 100,
            title: {
                display: true,
                text: 'Aderência (%)',
                font: { size: 13, weight: 'bold' as const },
                color: 'rgb(59, 130, 246)',
            },
            ticks: {
                callback: (value: any) => `${value}%`,
                font: { size: 12 },
                color: 'rgb(59, 130, 246)',
            },
            grid: {
                display: false,
            }
        },
        x: {
            ticks: {
                font: { size: 12, weight: 'bold' as const },
            },
            grid: { color: 'rgba(0,0,0,0)' }
        }
    }
});
