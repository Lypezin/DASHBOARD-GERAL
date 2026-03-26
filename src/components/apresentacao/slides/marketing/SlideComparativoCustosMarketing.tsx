'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { MarketingCostData } from '@/types';

interface SlideComparativoCustosMarketingProps {
    isVisible: boolean;
    titulo: string; // Ex: "ATUAL" ou "PASSADA"
    data: MarketingCostData[];
}

import { CostsHeader } from './components/CostsHeader';
import { CostsTable } from './components/CostsTable';
import { calculateCostsTotals } from './utils/costsUtils';

const SlideComparativoCustosMarketing: React.FC<SlideComparativoCustosMarketingProps> = ({
    isVisible,
    titulo,
    data = []
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isVisible) return null;

    const totals = calculateCostsTotals(data);

    return (
        <div className={`w-full h-full flex flex-col p-10 font-sans overflow-hidden relative transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-white'
        }`}>
            <CostsHeader titulo={titulo} isDark={isDark} />

            <CostsTable data={data} totals={totals} isDark={isDark} />
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full -mr-48 -mt-48 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full -ml-48 -mb-48 blur-3xl" />
        </div>
    );
};

export default SlideComparativoCustosMarketing;
