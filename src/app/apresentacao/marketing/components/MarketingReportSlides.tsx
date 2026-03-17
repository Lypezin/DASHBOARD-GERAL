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
        </>
    );
};
