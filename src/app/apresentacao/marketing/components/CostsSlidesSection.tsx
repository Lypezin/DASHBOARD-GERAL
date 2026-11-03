'use client';

import React from 'react';
import SlideComparativoCustosMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoCustosMarketing';
import { MarketingCostsComparison } from '@/types';
import { MarketingSlideFrame } from './MarketingSlideFrame';

interface CostsSlidesSectionProps {
    costsComparison: MarketingCostsComparison;
    sourceNote?: string;
    currentPeriod?: string;
    previousPeriod?: string;
}

export const CostsSlidesSection: React.FC<CostsSlidesSectionProps> = ({
    costsComparison,
    sourceNote,
    currentPeriod,
    previousPeriod,
}) => {
    return (
        <>
            {/* Slide: Comparativo de Custos - ATUAL */}
            <MarketingSlideFrame
                className="animate-slide-in-right"
                key="costs-atual" 
                id="slide-costs-atual"
            >
                <SlideComparativoCustosMarketing
                    isVisible={true}
                    titulo="ATUAL"
                    data={costsComparison.atual}
                    sourceNote={sourceNote}
                    periodLabel={currentPeriod}
                />
            </MarketingSlideFrame>

            {/* Slide: Comparativo de Custos - PASSADA */}
            <MarketingSlideFrame
                className="animate-slide-in-right"
                key="costs-passada" 
                id="slide-costs-passada"
            >
                <SlideComparativoCustosMarketing
                    isVisible={true}
                    titulo="ANTERIOR"
                    data={costsComparison.passada}
                    sourceNote={sourceNote}
                    periodLabel={previousPeriod}
                />
            </MarketingSlideFrame>
        </>
    );
};
