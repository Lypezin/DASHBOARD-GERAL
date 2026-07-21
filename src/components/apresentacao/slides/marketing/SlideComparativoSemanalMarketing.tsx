'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface WeeklyData {
    semana: string;
    criado: number;
    enviado: number;
    liberado: number;
    rodando: number;
    conversas?: number;
}

interface SlideComparativoSemanalMarketingProps {
    isVisible: boolean;
    titulo?: string;
    subtitulo?: string; // Ex: "Geral" ou "São Paulo"
    weeklyData: WeeklyData[];
}

import { WeeklyPerformanceHeader } from './components/WeeklyPerformanceHeader';
import { WeeklyPerformanceCard } from './components/WeeklyPerformanceCard';

const SlideComparativoSemanalMarketing: React.FC<SlideComparativoSemanalMarketingProps> = ({
    isVisible,
    titulo = "COMPARATIVO",
    subtitulo = "Geral",
    weeklyData = []
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const visibleWeeks = weeklyData.slice(-8);
    const columnsClass =
        visibleWeeks.length <= 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : visibleWeeks.length === 2
                ? 'grid-cols-2 max-w-4xl mx-auto'
                : visibleWeeks.length === 3
                    ? 'grid-cols-3'
                    : visibleWeeks.length === 6
                        ? 'grid-cols-3'
                        : 'grid-cols-4';

    if (!isVisible) return null;

    return (
        <div className={`w-full h-full flex flex-col p-10 font-sans overflow-hidden relative transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'
        }`}>
            <WeeklyPerformanceHeader titulo={titulo} subtitulo={subtitulo} isDark={isDark} />

            <div className={`grid flex-1 items-center gap-3.5 pb-12 ${columnsClass}`}>
                {visibleWeeks.map((week, idx) => (
                    <WeeklyPerformanceCard 
                        key={idx} 
                        week={week} 
                        idx={idx} 
                        isDark={isDark} 
                        compact={visibleWeeks.length > 4}
                    />
                ))}
            </div>
            <div className="absolute bottom-6 left-10 flex items-center gap-4 opacity-30">
                <div className={`h-[1px] w-10 ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`} />
                <span className={`text-[8px] font-bold uppercase tracking-[0.4em] transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-500'
                }`}>Weekly Performance Audit</span>
            </div>
        </div>
    );
};

export default SlideComparativoSemanalMarketing;
