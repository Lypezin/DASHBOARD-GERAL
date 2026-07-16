'use client';

import React from 'react';
import SlideComparativoCustosMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoCustosMarketing';
import { MarketingCostsComparison } from '@/types';
import { MarketingSlideFrame } from './MarketingSlideFrame';

interface CostsSlidesSectionProps {
    costsComparison: MarketingCostsComparison;
}

export const CostsSlidesSection: React.FC<CostsSlidesSectionProps> = ({ 
    costsComparison 
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
                />
            </MarketingSlideFrame>
        </>
    );
};
