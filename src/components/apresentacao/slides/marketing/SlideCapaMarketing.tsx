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
            {/* Background Sutil - Gradiente Radial */}
            <div className={`absolute inset-0 opacity-60 transition-opacity duration-500 ${
                isDark 
                ? 'bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#0A1D3A_100%)]' 
                : 'bg-[radial-gradient(circle_at_50%_50%,#f8fafc_0%,#f1f5f9_100%)]'
            }`} />

            {/* Formas Abstratas Premium */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: isDark ? [0.1, 0.15, 0.1] : [0.3, 0.4, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -top-[10%] -right-[5%] w-[50%] h-[50%] rounded-full blur-[100px] ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-200/40'
                }`}
            />
            
            <motion.div 
                animate={{ 
                    scale: [1.1, 1, 1.1],
                    opacity: isDark ? [0.05, 0.1, 0.05] : [0.2, 0.3, 0.2]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -bottom-[15%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] ${
                    isDark ? 'bg-slate-400/10' : 'bg-slate-200/30'
                }`}
            />

            {/* Barra Lateral Sofisticada */}
            <div className="absolute left-0 top-0 h-full w-[120px] pointer-events-none">
                <div className={`h-full w-2 ${isDark ? 'bg-blue-600/30' : 'bg-blue-600/10'}`} />
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center px-6 opacity-30">
                    <div className="h-1 w-8 bg-blue-400 mb-2" />
                    <div className="h-1 w-12 bg-blue-400 mb-2" />
                    <div className="h-1 w-6 bg-blue-400" />
                </div>
            </div>

            {/* Conteúdo Centralizado e Elegante */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-center z-10 max-w-4xl"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`h-[2px] w-12 ${isDark ? 'bg-blue-500/50' : 'bg-blue-500/30'}`} />
                        <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-bold uppercase tracking-[0.4em] text-xs`}>
                             Apresentação Operacional
                        </span>
                        <div className={`h-[2px] w-12 ${isDark ? 'bg-blue-500/50' : 'bg-blue-500/30'}`} />
                    </div>
                </div>

                <h1 className={`text-[90px] font-bold leading-tight mb-4 tracking-tight transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-900'
                }`}>
                    {titulo}
                </h1>
                
                <h2 className={`text-[42px] font-medium tracking-tight mb-12 transition-colors duration-500 ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                    {periodo}
                </h2>
                
                {subtitulo && (
                    <div className="flex flex-col items-center">
                        <div className="h-1 w-24 bg-blue-600 rounded-full mb-8" />
                        <p className={`text-lg font-medium uppercase tracking-[0.6em] transition-colors duration-500 ${
                            isDark ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                            {subtitulo}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Rodapé Minimalista */}
            <div className="absolute bottom-16 w-full flex justify-center items-center px-20">
                <div className="flex items-center gap-6 opacity-40">
                    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>Dashboard Geral</span>
                    <div className={`h-4 w-[1px] ${isDark ? 'bg-white/30' : 'bg-slate-900/20'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>Marketing Performance</span>
                </div>
            </div>
        </div>
    );
};

export default SlideCapaMarketing;
