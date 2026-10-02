'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@/contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EvolucaoSlideChartProps {
    evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
}

const customDataLabels = {
    id: 'customDataLabels',
    afterDatasetsDraw(chart: any) {
        const { ctx, data } = chart;
        const pointCount = data.labels?.length || 0;
        const labelStride = Math.max(1, Math.ceil(pointCount / 16));
        ctx.save();
        data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((element: any, index: number) => {
                const value = dataset.data[index];
                if (value > 0 && (index % labelStride === 0 || index === pointCount - 1)) {
                    ctx.fillStyle = dataset.borderColor;
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(value, element.x, element.y - 10);
                }
            });
        });
        ctx.restore();
    }
};

export const EvolucaoSlideChart: React.FC<EvolucaoSlideChartProps> = ({ evolutionData }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const chartData = {
        labels: evolutionData.map(d => {
            const date = new Date(d.data + 'T12:00:00');
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [
            {
                label: 'Total de Driver (Liberado)',
                data: evolutionData.map(d => d.liberado),
                borderColor: '#173b2f',
                backgroundColor: 'rgba(23, 59, 47, 0.08)',
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#173b2f',
                pointBorderColor: isDark ? '#0d1f18' : '#f7f5ee',
                pointBorderWidth: 2,
                borderWidth: 4,
                fill: true,
            },
            {
                label: 'Total de Driver (Enviado)',
                data: evolutionData.map(d => d.enviado),
                borderColor: '#8a9a80',
                backgroundColor: 'rgba(138, 154, 128, 0.08)',
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#8a9a80',
                pointBorderColor: isDark ? '#0d1f18' : '#f7f5ee',
                pointBorderWidth: 2,
                borderWidth: 4,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 350,
            easing: 'easeOutQuart' as const,
            onComplete: () => window.dispatchEvent(new Event('marketing-chart-ready')),
        },
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'center' as const,
                labels: {
                    usePointStyle: true,
                    font: { size: 12, weight: '600' as any, family: 'Inter' },
                    padding: 16,
                    color: isDark ? '#bcc7bc' : '#525c52'
                }
            },
            tooltip: {
                backgroundColor: isDark ? 'rgba(13, 31, 24, 0.96)' : 'rgba(251, 250, 245, 0.97)',
                titleColor: isDark ? '#f1f3ea' : '#17261e',
                bodyColor: isDark ? '#bcc7bc' : '#525c52',
                borderColor: isDark ? '#33443a' : '#d6d4ca',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: isDark ? 'rgba(188, 199, 188, 0.12)' : '#dfded5' },
                ticks: { font: { size: 11, family: 'Inter' }, color: isDark ? '#bcc7bc' : '#667066' }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    color: isDark ? '#bcc7bc' : '#667066',
                    autoSkip: true,
                    maxTicksLimit: 15,
                    maxRotation: 0,
                    minRotation: 0,
                    callback: (_value: string | number, index: number) => chartData.labels[index] ?? ''
                }
            }
        },
    };

    return (
        <div className="mb-6 min-h-[250px] flex-[1.5] rounded-lg border border-border bg-card p-6">
            <Line data={chartData} options={chartOptions} plugins={[customDataLabels]} />
        </div>
    );
};
