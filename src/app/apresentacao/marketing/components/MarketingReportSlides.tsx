'use client';

import React from 'react';
import SlideCapaMarketing from '@/components/apresentacao/slides/marketing/SlideCapaMarketing';
import SlideEvolucaoResumoMarketing from '@/components/apresentacao/slides/marketing/SlideEvolucaoResumoMarketing';
import { MarketingTotals, MarketingCityData, MarketingCostsComparison } from '@/types';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

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
    totals: _totals,
    citiesData,
    evolutionData,
    weeklyData,
    weeklyDataByCity,
    costsComparison,
    titulo: _titulo,
    periodoFormatado
}) => {
    const router = useRouter();
    const { theme } = useTheme();
    
    const onExit = () => router.push('/?tab=marketing');

    return (
        <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 animate-blur-in ${
            theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'
        }`}>
            <div className="mesh-gradient" />
            <PresentationSpotlight />
            <MarketingFloatingNav />
            <MarketingExitButton onExit={onExit} theme={theme} />

            <div id="top" className="page animate-slide-up">
                <SlideCapaMarketing isVisible titulo="Cadastros Marketing" periodo={periodoFormatado} subtitulo="Relatório de Resultados" />
            </div>

            <div id="unidades" className="page animate-slide-up">
                <SlideEvolucaoResumoMarketing isVisible={true} evolutionData={evolutionData} citiesData={citiesData} />
            </div>

            <div id="semanal">
                <WeeklySlidesSection weeklyData={weeklyData} weeklyDataByCity={weeklyDataByCity} />
            </div>

            <div id="custos">
                <CostsSlidesSection costsComparison={costsComparison} />
            </div>
        </div>
    );
};
