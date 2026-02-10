import { useMemo } from 'react';

export const useChartData = (data: any[]) => {
    return useMemo(() => {
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
                    label: 'Retomada',
                    data: sortedData.map(d => d.retomada_total || 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.85)',
                    borderColor: 'rgb(59, 130, 246)',
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
};
