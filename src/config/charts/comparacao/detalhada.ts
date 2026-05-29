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
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1e293b',
            bodyColor: '#334155',
            borderColor: 'rgba(226, 232, 240, 1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: { size: 14, weight: 'bold' as const },
            bodyFont: { size: 13, weight: 'normal' as const },
            bodySpacing: 8,
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
