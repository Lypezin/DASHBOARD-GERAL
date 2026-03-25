'use client';

import React from 'react';
import SlideCapaMarketing from '@/components/apresentacao/slides/marketing/SlideCapaMarketing';
import SlideEvolucaoResumoMarketing from '@/components/apresentacao/slides/marketing/SlideEvolucaoResumoMarketing';
import SlideComparativoSemanalMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoSemanalMarketing';
import SlideComparativoCustosMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoCustosMarketing';
import { MarketingTotals, MarketingCityData, MarketingCostsComparison } from '@/types';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

interface MarketingReportSlidesProps {
    totals: MarketingTotals;
    citiesData: MarketingCityData[];
    evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
    weeklyData: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>;
    weeklyDataByCity: Array<{ cidade: string; data: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }> }>;
    costsComparison: MarketingCostsComparison;
    titulo: string;
    periodoFormatado: string;
}

export const MarketingReportSlides: React.FC<MarketingReportSlidesProps> = ({
    totals,
    citiesData,
    evolutionData,
    weeklyData,
    weeklyDataByCity,
    costsComparison,
    titulo,
    periodoFormatado
}) => {
    const router = useRouter();
    const { theme } = useTheme();
    
    const handleSair = () => {
        // Voltar para a aba de Marketing no dashboard (evita ficar preso na mesma rota de apresentação)
        router.push('/?tab=marketing');
    };

    return (
        <div className={`relative min-h-screen pb-20 transition-colors duration-500 ${
            theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'
        }`}>
            {/* Botão Sair da Apresentação - Glassmorphism v2 */}
            <div className="fixed top-8 right-8 z-[9999] print:hidden">
                <button 
                    onClick={handleSair}
                    className={`flex items-center gap-3 px-6 py-3 backdrop-blur-2xl border rounded-xl font-black text-xs transition-all active:scale-95 group tracking-[0.2em] overflow-hidden relative ${
                        theme === 'dark'
                        ? 'bg-slate-900/60 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : 'bg-white/60 border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:bg-white/80 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    }`}
                >
                    {/* Brilho interno animado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-500 text-blue-400" />
                    <span className="relative z-10 text-xs">SAIR DA APRESENTAÇÃO</span>
                </button>
            </div>

            <motion.div 
                className="page"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <SlideCapaMarketing
                    isVisible
                    titulo="Cadastros Marketing"
                    periodo={periodoFormatado}
                    subtitulo="Relatório de Resultados"
                />
            </motion.div>

            <motion.div 
                className="page"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
                <SlideEvolucaoResumoMarketing
                    isVisible
                    evolutionData={evolutionData}
                    citiesData={citiesData}
                />
            </motion.div>

            {/* Slide 3: Comparativo Semanal - GERAL */}
            <motion.div 
                className="page" 
                key="weekly-general" 
                id="slide-weekly-general"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <SlideComparativoSemanalMarketing 
                    isVisible={true}
                    titulo="COMPARATIVO SEMANAL"
                    subtitulo="VISÃO GERAL DO PROJETO"
                    weeklyData={weeklyData}
                />
            </motion.div>

            {/* Slides 4+: Comparativo Semanal por CIDADES */}
            {weeklyDataByCity.map((cityInfo, idx) => (
                <motion.div 
                    className="page" 
                    key={`weekly-city-${idx}`} 
                    id={`slide-weekly-${cityInfo.cidade}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                >
                    <SlideComparativoSemanalMarketing 
                        isVisible={true}
                        titulo={`COMPARATIVO SEMANAL`}
                        subtitulo={cityInfo.cidade.toUpperCase()}
                        weeklyData={cityInfo.data}
                    />
                </motion.div>
            ))}

            {/* Slide: Comparativo de Custos - ATUAL */}
            <motion.div 
                className="page" 
                key="costs-atual" 
                id="slide-costs-atual"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <SlideComparativoCustosMarketing
                    isVisible={true}
                    titulo="ATUAL"
                    data={costsComparison.atual}
                />
            </motion.div>

            {/* Slide: Comparativo de Custos - PASSADA */}
            <motion.div 
                className="page" 
                key="costs-passada" 
                id="slide-costs-passada"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
            >
                <SlideComparativoCustosMarketing
                    isVisible={true}
                    titulo="ANTERIOR"
                    data={costsComparison.passada}
                />
            </motion.div>
        </div>
    );
};
