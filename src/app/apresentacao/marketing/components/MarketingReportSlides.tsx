'use client';

import React from 'react';
import SlideCapaMarketing from '@/components/apresentacao/slides/marketing/SlideCapaMarketing';
import SlideEvolucaoResumoMarketing from '@/components/apresentacao/slides/marketing/SlideEvolucaoResumoMarketing';
import SlideComparativoSemanalMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoSemanalMarketing';
import SlideComparativoCustosMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoCustosMarketing';
import { MarketingTotals, MarketingCityData, MarketingCostsComparison } from '@/types';
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

import { MarketingExitButton } from './MarketingExitButton';
import { WeeklySlidesSection } from './WeeklySlidesSection';
import { CostsSlidesSection } from './CostsSlidesSection';
import { PresentationSpotlight } from '@/components/apresentacao/components/PresentationSpotlight';
import { MarketingFloatingNav } from '@/components/apresentacao/components/MarketingFloatingNav';

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
    
    const onExit = () => router.push('/?tab=marketing');

    return (
        <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 animate-blur-in transform-gpu ${
            theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'
        }`}>
            <div className="mesh-gradient transform-gpu" />
            <PresentationSpotlight />
            <MarketingFloatingNav />
            <MarketingExitButton onExit={onExit} theme={theme} />

            <motion.div id="top" className="page" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                <SlideCapaMarketing isVisible titulo="Cadastros Marketing" periodo={periodoFormatado} subtitulo="Relatório de Resultados" />
            </motion.div>

            <motion.div id="unidades" className="page" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} viewport={{ once: true }}>
                <SlideEvolucaoResumoMarketing isVisible={true} evolutionData={evolutionData} citiesData={citiesData} />
            </motion.div>

            <div id="semanal">
                <WeeklySlidesSection weeklyData={weeklyData} weeklyDataByCity={weeklyDataByCity} />
            </div>

            <div id="custos">
                <CostsSlidesSection costsComparison={costsComparison} />
            </div>
        </div>
    );
};
