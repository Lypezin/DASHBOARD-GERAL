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
        <div className="flex h-full w-full flex-col overflow-hidden bg-background p-8 font-sans text-foreground">
            {/* Header Sofisticado */}
            <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
                <div className="flex items-center gap-6">
                    <div className="h-12 w-1.5 rounded-full bg-primary" />
                    <div>
                        <h2 className="text-5xl font-semibold tracking-tight text-primary">
                            {titulo.toUpperCase()}
                        </h2>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Análise de Volume Diário</p>
                    </div>
                </div>
                <div className="flex flex-col items-end opacity-60">
                    <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">GO Itaim</span>
                    <span className="text-lg font-semibold tracking-tight text-foreground">Marketing</span>
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
