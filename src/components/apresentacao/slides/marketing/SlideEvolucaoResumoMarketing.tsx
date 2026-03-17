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
                <div className="flex items-center gap-1">
                    <span className="text-2xl font-black text-[#0A1D47]">GO</span>
                    <div className="w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Área do Gráfico */}
            <div className="flex-1 min-h-[300px] mb-8">
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Seção Resumo */}
            <div className="border-t-2 border-slate-100 pt-6">
                <h3 className="text-4xl font-black text-[#10B981] text-center mb-8 italic uppercase tracking-tighter">Resumo</h3>
                
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4 px-4 overflow-hidden">
                    {citiesData.map((data, idx) => (
                        <div key={idx} className="flex flex-col">
                            <h4 className="text-[#10B981] font-bold text-sm mb-2 truncate">{data.cidade.replace(' 2.0', '')}</h4>
                            <ul className="text-[10px] space-y-1 font-bold text-slate-800">
                                <li>• Doc. Coletado: {data.enviado}</li>
                                <li>• Enviado: {data.enviado}</li>
                                <li>• Liberado: {data.liberado}</li>
                                <li>• Rodando: {data.rodandoInicio}</li>
                                <li>• Aberto: {data.aberto}</li>
                                <li>• Voltou: {data.voltou}</li>
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SlideEvolucaoResumoMarketing;
