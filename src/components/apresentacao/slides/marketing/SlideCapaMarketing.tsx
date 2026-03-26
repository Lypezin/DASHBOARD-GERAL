'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface SlideCapaMarketingProps {
    isVisible: boolean;
    titulo?: string;
    subtitulo?: string;
    periodo?: string;
}

import { CapaBackground } from './components/CapaBackground';
import { CapaTitle } from './components/CapaTitle';
import { CapaFooter } from './components/CapaFooter';

const SlideCapaMarketing: React.FC<SlideCapaMarketingProps> = ({
    isVisible,
    titulo = "Cadastros Marketing",
    subtitulo = "Relatório de Resultados",
    periodo = "Período Atual"
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isVisible) return null;

    return (
        <div className={`relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-20 font-sans transition-colors duration-500 ${
            isDark ? 'bg-[#0A1D3A]' : 'bg-white'
        }`}>
            <CapaBackground isDark={isDark} />
            
            <CapaTitle 
                titulo={titulo} 
                subtitulo={subtitulo} 
                periodo={periodo} 
                isDark={isDark} 
            />

            <CapaFooter isDark={isDark} />
        </div>
    );
};

export default SlideCapaMarketing;
