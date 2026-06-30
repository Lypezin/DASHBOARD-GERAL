import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';

const CHART_COLORS = [
    { bg: 'rgba(147, 51, 234, 0.2)', border: 'rgb(147, 51, 234)' },
    { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
    { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
    { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
    { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
];

interface ComparacaoChartSubPracaProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
}

export const ComparacaoChartSubPraca = React.memo(function ComparacaoChartSubPraca({
    dadosComparacao,
    semanasSelecionadas,
}: ComparacaoChartSubPracaProps) {
    const subPracas = useMemo(
        () => Array.from(new Set(dadosComparacao.flatMap((d) => d.aderencia_sub_praca?.map((sp) => sp.sub_praca) ?? []))),
        [dadosComparacao]
    );

    const subPracaMaps = useMemo(() => (
        dadosComparacao.map((dados) => {
            const map = new Map<string, number>();
            dados.aderencia_sub_praca?.forEach((subPraca) => {
                if (subPraca.sub_praca) {
                    map.set(subPraca.sub_praca, subPraca.aderencia_percentual ?? 0);
                }
            });
            return map;
        })
    ), [dadosComparacao]);

    const data = useMemo(() => ({
        labels: subPracas,
        datasets: semanasSelecionadas.map((semana, idx) => {
            const cor = CHART_COLORS[idx % CHART_COLORS.length];
            const semanaMap = subPracaMaps[idx];

            return {
                label: `Semana ${semana}`,
                data: subPracas.map((subPraca) => semanaMap?.get(subPraca) ?? 0),
                backgroundColor: cor.bg,
                borderColor: cor.border,
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
            };
        }),
    }), [semanasSelecionadas, subPracaMaps, subPracas]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: true,
        animation: {
            duration: 800,
            easing: 'easeOutQuart' as const
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#334155',
                borderColor: 'rgba(226, 232, 240, 1)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                bodyFont: { size: 13, weight: 'normal' as const },
                titleFont: { size: 14, weight: 'bold' as const },
                callbacks: {
                    label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { callback: (value: any) => `${value}%` }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 }
            }
        }
    }), []);

    return (
        <div className="p-6">
            <Line data={data} options={options} />
        </div>
    );
});

ComparacaoChartSubPraca.displayName = 'ComparacaoChartSubPraca';
