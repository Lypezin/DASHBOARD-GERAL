import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';

interface ComparacaoChartOrigemProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    origensDisponiveis: string[];
}

export const ComparacaoChartOrigem: React.FC<ComparacaoChartOrigemProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    origensDisponiveis,
}) => {
    const origemChartData = useMemo(() => {
        if (origensDisponiveis.length === 0) return null;

        const barColors = ['rgba(59,130,246,0.75)', 'rgba(99,102,241,0.75)', 'rgba(16,185,129,0.75)'];
        const lineColors = ['rgba(239,68,68,0.9)', 'rgba(236,72,153,0.85)', 'rgba(234,179,8,0.85)'];

        const datasets: any[] = [];

        semanasSelecionadas.forEach((semana, idx) => {
            datasets.push({
                type: 'bar' as const,
                label: `Completadas S${semana}`,
                data: origensDisponiveis.map((origem) => {
                    const dadosSemana = dadosComparacao[idx];
                    const origemData = dadosSemana?.aderencia_origem?.find((o) => (o.origem || '').trim() === origem);
                    return origemData?.corridas_completadas ?? 0;
                }),
                backgroundColor: barColors[idx % barColors.length],
                borderRadius: 8,
                maxBarThickness: 48,
                yAxisID: 'y',
                order: idx,
            });

            datasets.push({
                type: 'line' as const,
                label: `Aderência S${semana}`,
                data: origensDisponiveis.map((origem) => {
                    const dadosSemana = dadosComparacao[idx];
                    const origemData = dadosSemana?.aderencia_origem?.find((o) => (o.origem || '').trim() === origem);
                    return origemData?.aderencia_percentual ?? 0;
                }),
                borderColor: lineColors[idx % lineColors.length],
                backgroundColor: lineColors[idx % lineColors.length],
                borderWidth: 3,
                tension: 0.35,
                fill: false,
                yAxisID: 'y1',
                pointRadius: 6,
                pointHoverRadius: 9,
                order: idx + 10,
            });
        });

        return {
            labels: origensDisponiveis,
            datasets,
        };
    }, [origensDisponiveis, dadosComparacao, semanasSelecionadas]);

    const origemChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        if (context.dataset?.yAxisID === 'y1') {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        }
                        return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Corridas Completadas',
                },
            },
            y1: {
                beginAtZero: true,
                position: 'right' as const,
                min: 0,
                max: 100,
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: (value: any) => `${value}%`,
                },
                title: {
                    display: true,
                    text: 'Aderência (%)',
                },
            },
        },
    }), []);

    if (!origemChartData) return null;

    return (
        <div className="p-6">
            <div className="h-[420px]">
                <Bar data={origemChartData} options={origemChartOptions} />
            </div>
        </div>
    );
};
