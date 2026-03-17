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
            // Tenta voltar na história, se não conseguir (ex: aba aberta diretamente), tenta fechar ou ir para home
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020617] pb-20">
            {/* Botão Sair da Apresentação - Glassmorphism v2 */}
            <div className="fixed top-8 right-8 z-[9999] print:hidden">
                <button 
                    onClick={handleSair}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-xl text-white font-black text-xs shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 group tracking-[0.2em] overflow-hidden relative"
                >
                    {/* Brilho interno animado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-500 text-blue-400" />
                    <span className="relative z-10">SAIR DA APRESENTAÇÃO</span>
                </button>
            </div>

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
