import { useMemo } from 'react';

export const useChartOptions = () => {
    return useMemo(() => ({
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
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
                            // Para Saídas, mostrar valor absoluto (pois plotamos negativo)
                            if (context.dataset.label === 'Saídas') {
                                label += Math.abs(context.parsed.y);
                            } else {
                                // Para Saldo e Entradas, mostrar valor real (pode ser negativo)
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
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    font: { size: 11 },
                    color: 'rgb(148, 163, 184)',
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
                    color: 'rgb(148, 163, 184)',
                    padding: 8,
                }
            }
        }
    }), []);
};
