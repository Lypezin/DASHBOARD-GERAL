'use client';

import React from 'react';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideMarketingResumo from '@/components/apresentacao/slides/marketing/SlideMarketingResumo';
import { MarketingTotals } from '@/types';

interface MarketingReportSlidesProps {
    totals: MarketingTotals;
    titulo?: string;
}

export const MarketingReportSlides: React.FC<MarketingReportSlidesProps> = ({
    totals,
    titulo
}) => {
    return (
        <>
            <div className="page">
                <SlideCapa
                    isVisible
                    pracaSelecionada="GERAL MARKETING"
                    numeroSemana1="ATUAL"
                    numeroSemana2=""
                    periodoSemana1=""
                    periodoSemana2=""
                />
            </div>

            <div className="page">
                <SlideMarketingResumo
                    isVisible
                    totals={totals}
                    titulo={titulo}
                />
            </div>
        </>
    );
};
