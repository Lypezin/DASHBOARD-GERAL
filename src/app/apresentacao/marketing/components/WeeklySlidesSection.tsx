'use client';

import React from 'react';
import { motion } from 'framer-motion';
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

            {/* Slides: Comparativo Semanal por CIDADES */}
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
        </>
    );
};
