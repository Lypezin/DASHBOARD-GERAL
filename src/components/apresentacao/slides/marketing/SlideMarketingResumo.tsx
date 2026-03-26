'use client';

import React from 'react';
import SlideWrapper from '../../SlideWrapper';
import { MarketingTotals } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { MarketingMetricCard } from './components/MarketingMetricCard';
import { getMarketingMetrics } from './utils/marketingMetrics';

interface SlideMarketingResumoProps {
    isVisible: boolean;
    totals: MarketingTotals;
    titulo?: string;
}

const SlideMarketingResumo: React.FC<SlideMarketingResumoProps> = ({
    isVisible,
    totals,
    titulo = "RESULTADOS MARKETING"
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const metrics = getMarketingMetrics(totals, isDark);

    return (
        <SlideWrapper isVisible={isVisible}>
            <div className={`flex flex-col h-full w-full p-16 font-sans transition-colors duration-500 ${
                isDark ? 'bg-[#020617]' : 'bg-white'
            }`}>
                <header className="mb-14 flex items-center gap-6">
                    <div className="h-10 w-2 bg-blue-600 rounded-full" />
                    <h2 className={`text-5xl font-bold tracking-tight transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                        {titulo}
                    </h2>
                </header>

                <div className="grid grid-cols-3 gap-6 flex-grow">
                    {metrics.map((metric, idx) => (
                        <MarketingMetricCard 
                            key={idx}
                            {...metric}
                            isDark={isDark}
                        />
                    ))}
                </div>

                <footer className="mt-12 flex justify-between items-center px-2">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Relatório de Performance</span>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Marketing Insights</span>
                    </div>
                </footer>
            </div>
        </SlideWrapper>
    );
};

export default SlideMarketingResumo;
