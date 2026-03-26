'use client';

import React from 'react';
import SlideWrapper from '../../SlideWrapper';
import { MarketingTotals } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { MarketingMetricCard } from './components/MarketingMetricCard';
import { getMarketingMetrics } from './utils/marketingMetrics';
import { MarketingFunnelChart } from './components/MarketingFunnelChart';
import { motion } from 'framer-motion';

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

                <div className="flex flex-grow gap-12 items-center">
                    {/* Metrics Side (40%) */}
                    <div className="w-[40%] flex flex-col gap-6">
                        {metrics.slice(0, 3).map((metric, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                viewport={{ once: true }}
                            >
                                <MarketingMetricCard 
                                    {...metric}
                                    isDark={isDark}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Funnel Side (60%) */}
                    <div className="w-[60%] flex flex-col justify-center h-full">
                        <MarketingFunnelChart totals={totals} />
                    </div>
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
