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
    titulo = "Total de Migrações"
}) => {
    if (!isVisible) return null;

    const chartData = {
        labels: evolutionData.map(d => {
            const date = new Date(d.data);
            return `Dia ${date.getDate()}`;
        }),
        datasets: [
            {
                label: 'Total de Driver (Liberado)',
                data: evolutionData.map(d => d.liberado),
                borderColor: '#3B82F6',
                backgroundColor: '#3B82F6',
                tension: 0.4,
                pointRadius: 4,
                borderWidth: 3,
            },
            {
                label: 'Total de Driver (Enviado)',
                data: evolutionData.map(d => d.enviado),
                borderColor: '#0A1D47',
                backgroundColor: '#0A1D47',
                tension: 0.4,
                pointRadius: 4,
                borderWidth: 3,
            }
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
                    font: { size: 14, weight: 'bold' as any },
                    padding: 20,
                    color: '#0A1D47'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#0A1D47',
                bodyColor: '#0A1D47',
                borderColor: '#E2E8F0',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#F1F5F9' },
                ticks: { font: { size: 12 }, color: '#64748B' }
            },
            x: {
                grid: { display: false },
                ticks: { 
                    font: { size: 12 }, 
                    color: '#64748B',
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
    };

    return (
        <div className="w-full h-full bg-white flex flex-col p-10 font-sans overflow-hidden">
            {/* Header do Slide */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#3B82F6] flex items-center gap-2">
                        SH SP <span className="text-slate-300">|</span> <span className="text-blue-500 font-medium">{titulo}</span>
                    </h2>
                    <div className="bg-slate-200 text-slate-600 px-3 py-1 text-xs font-bold rounded mt-1 inline-block uppercase tracking-wider">
                        Tickets Totais → Migração
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Performance</span>
                        <span className="text-xl font-black text-slate-800 tracking-tighter">DATA ANALYTICS</span>
                    </div>
                    <div className="w-1 h-10 bg-blue-600 rounded-full" />
                </div>
            </div>

            {/* Área do Gráfico */}
            <div className="flex-1 min-h-[300px] mb-8">
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Seção Resumo */}
            <div className="mt-auto pt-8 border-t border-slate-100">
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="h-px w-24 bg-slate-200" />
                    <h3 className="text-3xl font-black text-[#0A1D47] italic uppercase tracking-tighter">Resumo por Unidade</h3>
                    <div className="h-px w-24 bg-slate-200" />
                </div>
                
                <div className="grid grid-cols-4 lg:grid-cols-4 gap-4 px-2">
                    {citiesData.map((data, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-[#3B82F6] font-black text-lg mb-3 border-b border-blue-100 pb-1 flex justify-between items-center">
                                {data.cidade.replace(' 2.0', '')}
                                <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest italic">Unidade</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Enviado</span>
                                    <span className="text-sm font-black text-slate-700">{data.enviado}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Liberado</span>
                                    <span className="text-sm font-black text-blue-600">{data.liberado}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Rodando</span>
                                    <span className="text-sm font-black text-green-600">{data.rodandoInicio}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Aberto</span>
                                    <span className="text-sm font-black text-orange-500">{data.aberto}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SlideEvolucaoResumoMarketing;
