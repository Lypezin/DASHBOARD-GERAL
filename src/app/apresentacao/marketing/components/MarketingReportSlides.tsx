'use client';

import React from 'react';
import SlideCapaMarketing from '@/components/apresentacao/slides/marketing/SlideCapaMarketing';
import SlideEvolucaoResumoMarketing from '@/components/apresentacao/slides/marketing/SlideEvolucaoResumoMarketing';
import SlideComparativoSemanalMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoSemanalMarketing';
import { MarketingTotals, MarketingCityData } from '@/types';

interface MarketingReportSlidesProps {
    totals: MarketingTotals;
    citiesData: MarketingCityData[];
    evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
    weeklyData: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>;
    titulo?: string;
    periodoFormatado?: string;
}

export const MarketingReportSlides: React.FC<MarketingReportSlidesProps> = ({
    totals,
    citiesData,
    evolutionData,
    weeklyData,
    titulo,
    periodoFormatado = "Período Atual"
}) => {
    return (
        <>
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

            <div className="page">
                <SlideComparativoSemanalMarketing
                    isVisible
                    data={weeklyData}
                    subtitulo="Geral"
                />
            </div>
        </>
    );
};
