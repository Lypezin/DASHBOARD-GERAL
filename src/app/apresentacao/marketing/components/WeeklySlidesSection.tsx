'use client';

import React from 'react';
import SlideComparativoSemanalMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoSemanalMarketing';

interface WeeklySlidesSectionProps {
    weeklyData: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }>;
    weeklyDataByCity: Array<{ cidade: string; data: Array<{ semana: string; criado: number; enviado: number; liberado: number; rodando: number; conversas?: number }> }>;
}

export const WeeklySlidesSection: React.FC<WeeklySlidesSectionProps> = ({ 
    weeklyData, 
    weeklyDataByCity 
}) => {
    return (
        <>
            {/* Slide: Comparativo Semanal - GERAL */}
            <div
                className="page animate-slide-up"
                key="weekly-general" 
                id="slide-weekly-general"
            >
                <SlideComparativoSemanalMarketing 
                    isVisible={true}
                    titulo="COMPARATIVO SEMANAL"
                    subtitulo="VISÃO GERAL DO PROJETO"
                    weeklyData={weeklyData}
                />
            </div>

            {/* Slides: Comparativo Semanal por CIDADES */}
            {weeklyDataByCity.map((cityInfo, idx) => (
                <div
                    className="page animate-fade-in"
                    key={`weekly-city-${idx}`} 
                    id={`slide-weekly-${cityInfo.cidade}`}
                >
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
