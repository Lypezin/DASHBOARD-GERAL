'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SlideComparativoCustosMarketing from '@/components/apresentacao/slides/marketing/SlideComparativoCustosMarketing';
import { MarketingCostsComparison } from '@/types';

interface CostsSlidesSectionProps {
    costsComparison: MarketingCostsComparison;
}

export const CostsSlidesSection: React.FC<CostsSlidesSectionProps> = ({ 
    costsComparison 
}) => {
    return (
        <>
            {/* Slide: Comparativo de Custos - ATUAL */}
            <motion.div 
                className="page" 
                key="costs-atual" 
                id="slide-costs-atual"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <SlideComparativoCustosMarketing
                    isVisible={true}
                    titulo="ATUAL"
                    data={costsComparison.atual}
                />
            </motion.div>

            {/* Slide: Comparativo de Custos - PASSADA */}
            <motion.div 
                className="page" 
                key="costs-passada" 
                id="slide-costs-passada"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
            >
                <SlideComparativoCustosMarketing
                    isVisible={true}
                    titulo="ANTERIOR"
                    data={costsComparison.passada}
                />
            </motion.div>
        </>
    );
};
