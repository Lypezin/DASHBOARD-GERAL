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
        ctx.save();
        data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((element: any, index: number) => {
                const value = dataset.data[index];
                if (value > 0) {
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
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#10b981',
                pointBorderColor: isDark ? '#020617' : '#fff',
                pointBorderWidth: 2,
                borderWidth: 4,
                fill: true,
            },
            {
                label: 'Total de Driver (Enviado)',
                data: evolutionData.map(d => d.enviado),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: isDark ? '#020617' : '#fff',
                pointBorderWidth: 2,
                borderWidth: 4,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'center' as const,
                labels: {
                    usePointStyle: true,
                    font: { size: 12, weight: '600' as any, family: 'Inter' },
                    padding: 16,
                    color: isDark ? '#94a3b8' : '#64748B'
                }
            },
            tooltip: {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: isDark ? '#f8fafc' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#64748B',
                borderColor: isDark ? '#1e293b' : '#f1f5f9',
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
                grid: { color: isDark ? 'rgba(51, 65, 85, 0.1)' : '#f1f5f9' },
                ticks: { font: { size: 11, family: 'Inter' }, color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    color: '#94a3b8',
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
        <div className={`flex-[1.5] min-h-[250px] mb-6 rounded-3xl p-6 border transition-all duration-500 ${
            isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
            <Line data={chartData} options={chartOptions} plugins={[customDataLabels]} />
        </div>
    );
};
