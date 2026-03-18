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

const SlideEvolucaoResumoMarketing: React.FC<SlideEvolucaoResumoMarketingProps> = ({
    isVisible,
    evolutionData,
    citiesData,
    titulo = "Evolução de Migrações"
}) => {
    if (!isVisible) return null;

    const chartData = {
        labels: evolutionData.map(d => {
            const date = new Date(d.data);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
        }),
        datasets: [
            {
                label: 'Liberados',
                data: evolutionData.map(d => d.liberado),
                borderColor: '#10b981', // Emerald
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
                fill: true,
            },
            {
                label: 'Enviados',
                data: evolutionData.map(d => d.enviado),
                borderColor: '#3B82F6', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
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
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    font: { size: 12, weight: '600' as any },
                    padding: 20,
                    color: '#64748B'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#0f172a',
                bodyColor: '#64748B',
                borderColor: '#f1f5f9',
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
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 11 }, color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 10 },
                    color: '#94a3b8',
                    autoSkip: true,
                    maxTicksLimit: 16,
                    callback: (value: string | number, index: number) => {
                        // Mostra a label real (DD/MM) no eixo x, sem usar o index como valor.
                        const label = chartData.labels[index];
                        if (!label) return '';
                        return index % 2 === 0 ? label : '';
                    }
                }
            }
        },
    };

    return (
        <div className="w-full h-full bg-[#f8fafc] flex flex-col p-14 font-sans overflow-hidden">
            {/* Header Sofisticado */}
            <div className="flex justify-between items-end mb-10 border-b-2 border-slate-200 pb-6">
                <div className="flex items-center gap-6">
                    <div className="h-12 w-2 bg-blue-600 rounded-full" />
                    <div>
                        <h2 className="text-4xl font-bold text-slate-800 tracking-tight">
                            {titulo}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Análise de Volume Diário</p>
                    </div>
                </div>
                <div className="flex flex-col items-end opacity-40">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Operational</span>
                    <span className="text-xl font-bold text-slate-800 tracking-tighter">INSIGHTS</span>
                </div>
            </div>

            {/* Área do Gráfico */}
            <div className="flex-1 min-h-[300px] mb-10 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Seção Resumo por Unidade */}
            <div className="mt-auto">
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Distribuição por Unidade</h3>
                    <div className="h-[1px] flex-1 bg-slate-200" />
                </div>
                
                <div className="grid grid-cols-4 gap-4 px-1">
                    {citiesData.slice(0, 4).map((data, idx) => (
                        <motion.div 
                            key={idx} 
                            whileHover={{ y: -4 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md"
                        >
                            <h4 className="text-slate-800 font-bold text-base mb-4 flex justify-between items-center border-b border-slate-50 pb-2">
                                {data.cidade.split(' ')[0]}
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            </h4>
                            <div className="grid grid-cols-2 gap-y-3">
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Enviado</span>
                                    <span className="text-sm font-bold text-slate-700">{data.enviado}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Liberado</span>
                                    <span className="text-sm font-bold text-blue-600">{data.liberado}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Rodando</span>
                                    <span className="text-sm font-bold text-emerald-600">{data.rodandoInicio}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Aberto</span>
                                    <span className="text-sm font-bold text-slate-500">{data.aberto}</span>
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
