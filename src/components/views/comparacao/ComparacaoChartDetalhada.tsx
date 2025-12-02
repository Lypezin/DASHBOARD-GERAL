import React from 'react';
import { Bar } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';

interface ComparacaoChartDetalhadaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoChartDetalhada: React.FC<ComparacaoChartDetalhadaProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    return (
        <div className="p-6">
            <Bar data={{
                labels: semanasSelecionadas.map(s => `Semana ${s}`),
                datasets: [
                    {
                        type: 'bar' as const,
                        label: 'Ofertadas',
                        data: dadosComparacao.map(d => d.total_ofertadas ?? 0),
                        backgroundColor: 'rgba(100, 116, 139, 0.7)',
                        borderColor: 'rgb(100, 116, 139)',
                        borderWidth: 1,
                        yAxisID: 'y-count',
                        order: 2,
                    },
                    {
                        type: 'bar' as const,
                        label: 'Aceitas',
                        data: dadosComparacao.map(d => d.total_aceitas ?? 0),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        yAxisID: 'y-count',
                        order: 2,
                    },
                    {
                        type: 'bar' as const,
                        label: 'Completadas',
                        data: dadosComparacao.map(d => d.total_completadas ?? 0),
                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                        borderColor: 'rgb(139, 92, 246)',
                        borderWidth: 1,
                        yAxisID: 'y-count',
                        order: 2,
                    },
                    {
                        type: 'line' as any,
                        label: 'Aderência (%)',
                        data: dadosComparacao.map(d => d.aderencia_semanal[0]?.aderencia_percentual ?? 0),
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y-percent',
                        order: 1,
                    },
                ] as any,
            }} options={{
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
                        grid: {
                            display: false,
                        }
                    }
                }
            }} />
        </div>
    );
};
