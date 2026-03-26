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

    if (!isVisible) return null;

    return (
        <div className={`w-full h-full flex flex-col p-10 font-sans overflow-hidden relative transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'
        }`}>
            <WeeklyPerformanceHeader titulo={titulo} subtitulo={subtitulo} isDark={isDark} />

            <div className="flex-1 grid grid-cols-4 gap-4 pb-12">
                {weeklyData.slice(-8).map((week, idx) => (
                    <WeeklyPerformanceCard key={idx} week={week} idx={idx} isDark={isDark} />
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
