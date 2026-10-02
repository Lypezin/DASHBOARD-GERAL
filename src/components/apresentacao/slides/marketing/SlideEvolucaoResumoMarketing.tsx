'use client';

import React from 'react';
import { MarketingCityData } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { EvolucaoSlideChart } from './components/EvolucaoSlideChart';
import { EvolucaoSlideCityGrid } from './components/EvolucaoSlideCityGrid';

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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isVisible) return null;

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

            {/* Gráfico de Evolução */}
            <EvolucaoSlideChart evolutionData={evolutionData} />

            {/* Seção Resumo por Unidade */}
            <EvolucaoSlideCityGrid citiesData={citiesData} />
        </div>
    );
};

export default SlideEvolucaoResumoMarketing;
