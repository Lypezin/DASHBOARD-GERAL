import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler,
} from 'chart.js';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

interface EntradaSaidaChartProps {
    data: any[];
}

export const EntradaSaidaChart: React.FC<EntradaSaidaChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const sortedData = [...data].sort((a, b) => a.semana.localeCompare(b.semana));

        return {
            labels: sortedData.map(d => {
                const match = d.semana.match(/-W(\d+)$/);
                return match ? `Sem ${match[1]}` : d.semana;
            }),
            datasets: [
                {
                    type: 'line' as const,
                    label: 'Saldo',
                    data: sortedData.map(d => d.saldo),
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
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
                    backgroundColor: 'rgba(16, 185, 129, 0.85)',
                    borderColor: 'rgb(16, 185, 129)',
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
                    backgroundColor: 'rgba(244, 63, 94, 0.85)',
                    borderColor: 'rgb(244, 63, 94)',
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
                    order: 1,
                    yAxisID: 'y',
                },
            ],
        };
    }, [data]);

    const options = {
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
    };

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Evolução Semanal
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Comparativo de entradas e saídas por semana
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-900">
                <div className="h-[380px] w-full">
                    <Bar data={chartData as any} options={options as any} />
                </div>
            </CardContent>
        </Card>
    );
};
