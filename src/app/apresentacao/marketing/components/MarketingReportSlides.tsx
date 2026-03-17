'use client';

import React from 'react';
import SlideCapaMarketing from '@/components/apresentacao/slides/marketing/SlideCapaMarketing';
import SlideEvolucaoResumoMarketing from '@/components/apresentacao/slides/marketing/SlideEvolucaoResumoMarketing';
import SlideComparativoSemanalMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoSemanalMarketing';
import { MarketingTotals, MarketingCityData } from '@/types';
import { X } from 'lucide-react';

interface MarketingReportSlidesProps {
    totals: MarketingTotals;
    citiesData: MarketingCityData[];
    evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
    weeklyData: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>;
    weeklyDataByCity: Array<{ cidade: string; data: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }> }>;
    titulo: string;
    periodoFormatado: string;
}

export const MarketingReportSlides: React.FC<MarketingReportSlidesProps> = ({
    totals,
    citiesData,
    evolutionData,
    weeklyData,
    weeklyDataByCity,
    titulo,
    periodoFormatado
}) => {
    const handleSair = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="relative min-h-screen bg-[#0f172a] pb-20">
            {/* Botão Sair da Apresentação - Glassmorphism */}
            <button 
                onClick={handleSair}
                className="fixed top-8 right-8 z-[9999] flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white font-black text-xs shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:bg-white/20 transition-all active:scale-95 print:hidden group tracking-[0.2em]"
            >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-500 text-blue-400" />
                <span>SAIR DA APRESENTAÇÃO</span>
            </button>

            <div className="page">
                <SlideCapaMarketing
                    isVisible
                    titulo="Cadastros Marketing"
                    periodo={periodoFormatado}
                    subtitulo="Relatório de Resultados"
                />
            </div>

            <div className="page">
                <SlideEvolucaoResumoMarketing
                    isVisible
                    evolutionData={evolutionData}
                    citiesData={citiesData}
                />
            </div>

            {/* Slide 3: Comparativo Semanal - GERAL */}
            <div className="page" key="weekly-general" id="slide-weekly-general">
                <SlideComparativoSemanalMarketing 
                    isVisible={true}
                    titulo="COMPARATIVO SEMANAL"
                    subtitulo="VISÃO GERAL DO PROJETO"
                    weeklyData={weeklyData}
                />
            </div>

            {/* Slides 4+: Comparativo Semanal por CIDADES */}
            {weeklyDataByCity.map((cityInfo, idx) => (
                <div className="page" key={`weekly-city-${idx}`} id={`slide-weekly-${cityInfo.cidade}`}>
                    <SlideComparativoSemanalMarketing 
                        isVisible={true}
                        titulo={`COMPARATIVO SEMANAL`}
                        subtitulo={cityInfo.cidade.toUpperCase()}
                        weeklyData={cityInfo.data}
                    />
                </div>
            ))}
        </div>
    );
};
