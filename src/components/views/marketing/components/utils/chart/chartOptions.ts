
import { CHART_COLORS } from './chartColors';

export const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index' as const,
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top' as const,
            align: 'end' as const,
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                padding: 20,
                font: {
                    size: 12,
                    weight: 500,
                }
            }
        },
        tooltip: {
            backgroundColor: CHART_COLORS.TOOLTIP.BACKGROUND,
            titleFont: { size: 13, weight: 600 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
                label: function (context: any) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        if (context.dataset.label === 'Saídas') {
                            label += Math.abs(context.parsed.y);
                        } else {
                            label += context.parsed.y;
                        }
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            grid: {
                color: CHART_COLORS.GRID.COLOR,
                drawBorder: false,
            },
            border: {
                display: false,
            },
            ticks: {
                font: { size: 11 },
                color: CHART_COLORS.GRID.TEXT,
                padding: 8,
                callback: function (value: any) {
                    return Math.abs(value);
                }
            }
        },
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            border: {
                display: false,
            },
            ticks: {
                font: { size: 11 },
                color: CHART_COLORS.GRID.TEXT,
                padding: 8,
            }
        }
    }
});
