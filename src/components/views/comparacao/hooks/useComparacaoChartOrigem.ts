import { useMemo } from 'react';
import { DashboardResumoData } from '@/types';

export function useComparacaoChartOrigem(
    dadosComparacao: DashboardResumoData[],
    semanasSelecionadas: string[],
    origensDisponiveis: string[]
) {
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

        return { labels: origensDisponiveis, datasets };
    }, [origensDisponiveis, dadosComparacao, semanasSelecionadas]);

    const origemChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#1e293b', bodyColor: '#334155',
                borderColor: 'rgba(226, 232, 240, 1)', borderWidth: 1, padding: 12, boxPadding: 6,
                usePointStyle: true, bodyFont: { size: 13, weight: 'normal' as const }, titleFont: { size: 14, weight: 'bold' as const },
                callbacks: {
                    label: (context: any) => {
                        if (context.dataset?.yAxisID === 'y1') return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
                    },
                },
            },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, title: { display: true, text: 'Corridas Completadas', color: '#64748b' } },
            y1: {
                beginAtZero: true, position: 'right' as const, min: 0, max: 100,
                grid: { drawOnChartArea: false }, ticks: { callback: (value: any) => `${value}%` },
                title: { display: true, text: 'Aderência (%)', color: '#64748b' },
            },
            x: { grid: { display: false } }
        },
    }), []);

    return { origemChartData, origemChartOptions };
}
