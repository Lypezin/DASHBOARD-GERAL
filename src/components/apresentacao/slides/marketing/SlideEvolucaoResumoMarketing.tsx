'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
import { MarketingCityData } from '@/types';
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

interface SlideEvolucaoResumoMarketingProps {
    isVisible: boolean;
    evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
    citiesData: MarketingCityData[];
    titulo?: string;
}

// Plugin customizado para desenhar os valores acima dos pontos
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

const SlideEvolucaoResumoMarketing: React.FC<SlideEvolucaoResumoMarketingProps> = ({
    isVisible,
    evolutionData,
    citiesData,
    titulo = "Evolução de Migrações"
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isVisible) return null;

    const chartData = {
        labels: evolutionData.map(d => {
            const date = new Date(d.data + 'T12:00:00');
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [
            {
                label: 'Total de Driver (Liberado)',
                data: evolutionData.map(d => d.liberado),
                borderColor: '#10b981', // Emerald
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
                borderColor: '#3b82f6', // Bright Blue
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
                    callback: (_value: string | number, index: number) => {
                        return chartData.labels[index] ?? '';
                    }
                }
            }
        },
    };

    return (
        <div className={`w-full h-full flex flex-col p-8 font-sans overflow-hidden transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'
        }`}>
            {/* Header Sofisticado */}
            <div className={`flex justify-between items-end mb-6 border-b-2 pb-4 transition-colors duration-500 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
                <div className="flex items-center gap-6">
                    <div className="h-16 w-2.5 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                    <div>
                        <h2 className={`text-6xl font-black tracking-tighter transition-all duration-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {titulo.toUpperCase()}
                        </h2>
                        <p className="text-[12px] text-blue-500 font-bold uppercase tracking-[0.5em] mt-2">📊 Análise de Volume Diário</p>
                    </div>
                </div>
                <div className="flex flex-col items-end opacity-60">
                    <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>OPERATIONAL</span>
                    <span className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>INSIGHTS</span>
                </div>
            </div>

            {/* Área do Gráfico */}
            <div className={`flex-[1.5] min-h-[250px] mb-6 rounded-3xl p-6 border transition-all duration-500 ${
                isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
                <Line data={chartData} options={chartOptions} plugins={[customDataLabels]} />
            </div>

            {/* Seção Resumo por Unidade */}
            <div className="mt-auto">
                <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Distribuição por Unidade</h3>
                    <div className={`h-[1px] flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                </div>
                
                <div className="grid grid-cols-4 gap-4 px-1">
                    {citiesData.map((data, idx) => (
                        <motion.div 
                            key={idx} 
                            whileHover={{ y: -4, scale: 1.02 }}
                            className={`rounded-xl p-6 border transition-all duration-300 ${
                                isDark 
                                ? 'bg-slate-900/40 border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.3)]' 
                                : 'bg-white border-slate-100 shadow-md hover:shadow-lg'
                            }`}
                        >
                            <h4 className={`font-black text-xl mb-4 flex justify-between items-center border-b pb-3 ${
                                isDark ? 'text-white border-slate-800' : 'text-slate-800 border-slate-100'
                            }`} title={data.cidade}>
                                <span className="truncate pr-2">{data.cidade}</span>
                                <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            </h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Criados</span>
                                    <span className={`text-xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{data.criado}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Enviados</span>
                                    <span className={`text-xl font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{data.enviado}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Liberados</span>
                                    <span className="text-xl font-black text-blue-500">{data.liberado}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Rodando</span>
                                    <span className="text-xl font-black text-emerald-500">{data.rodandoInicio}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Abertos</span>
                                    <span className="text-xl font-black text-slate-500">{data.aberto}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Voltou</span>
                                    <span className="text-xl font-black text-slate-500">{data.voltou}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SlideEvolucaoResumoMarketing;
