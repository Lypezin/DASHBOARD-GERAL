import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';
import { createComparacaoChartOptions } from '@/config/charts/comparacao/detalhada';

interface ComparacaoChartDetalhadaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoChartDetalhada: React.FC<ComparacaoChartDetalhadaProps> = ({
    dadosComparacao,
    semanasSelecionadas,
}) => {
    const options = useMemo(() => createComparacaoChartOptions(), []);

    const data = useMemo(() => ({
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
                type: 'line' as const,
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
        ],
    }), [dadosComparacao, semanasSelecionadas]);

    return (
        <div className="p-6">
            <Bar data={data as any} options={options} />
        </div>
    );
};
