import React from 'react';
import { Line } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';
import { findDayData } from '@/utils/comparacaoHelpers';

interface ComparacaoChartDiaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoChartDia: React.FC<ComparacaoChartDiaProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    return (
        <div className="p-6">
            <Line data={{
                labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
                datasets: semanasSelecionadas.map((semana, idx) => {
                    const cores = [
                        { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
                        { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
                        { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },
                        { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
                        { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
                    ];
                    const cor = cores[idx % cores.length];

                    return {
                        label: `Semana ${semana}`,
                        data: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => {
                            const dados = dadosComparacao[idx];
                            // Usar helper para encontrar dados do dia
                            const diaData = findDayData(dia, dados?.aderencia_dia);
                            return diaData?.aderencia_percentual ?? 0;
                        }),
                        backgroundColor: cor.bg,
                        borderColor: cor.border,
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    };
                }),
            }} options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' as const },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: (value: any) => `${value}%` } },
                    x: { ticks: { font: { size: 11 } } }
                }
            }} />
        </div>
    );
};
