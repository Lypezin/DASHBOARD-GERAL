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
            <div className={`absolute inset-0 opacity-80 transition-opacity duration-500 ${
                isDark 
                ? 'bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]' 
                : 'bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f8fafc_100%)]'
            }`} />

            {/* Formas Abstratas Premium - Novas e mais vibrantes */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    opacity: isDark ? [0.15, 0.25, 0.15] : [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[120px] ${
                    isDark ? 'bg-blue-600/20' : 'bg-blue-200/50'
                }`}
            />
            
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    opacity: isDark ? [0.1, 0.2, 0.1] : [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute bottom-[-10%] left-[-15%] w-[800px] h-[800px] rounded-full blur-[150px] ${
                    isDark ? 'bg-indigo-500/15' : 'bg-indigo-100/40'
                }`}
            />

            <motion.div 
                animate={{ 
                    rotate: [0, 360],
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className={`absolute top-[20%] left-[10%] w-[300px] h-[300px] border-[1px] rounded-[60px] ${
                    isDark ? 'border-blue-400' : 'border-blue-600'
                }`}
            />

            {/* Conteúdo Centralizado e Elegante */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-center z-10 max-w-5xl"
            >
                <motion.div 
                    initial={{ opacity: 0, letterSpacing: "0.2em" }}
                    animate={{ opacity: 1, letterSpacing: "0.5em" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="flex flex-col items-center mb-12"
                >
                    <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-black uppercase tracking-[0.5em] text-[10px]`}>
                        STRATEGIC MARKETING REPORT
                    </span>
                    <div className={`h-[1px] w-32 mt-4 ${isDark ? 'bg-gradient-to-r from-transparent via-blue-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-600/30 to-transparent'}`} />
                </motion.div>

                <h1 className={`text-[120px] font-black leading-[0.9] mb-8 tracking-tighter transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-900'
                }`}>
                    {titulo.split(' ').map((word, i) => (
                        <span key={i} className="block last:text-blue-500">{word}</span>
                    ))}
                </h1>
                
                <h2 className={`text-[46px] font-light tracking-tight mb-16 transition-colors duration-500 opacity-80 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                    {periodo}
                </h2>
                
                {subtitulo && (
                    <div className="flex flex-col items-center relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: 120 }}
                            transition={{ duration: 1, delay: 1 }}
                            className="h-[6px] bg-blue-600 rounded-full mb-10 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                        />
                        <p className={`text-xl font-bold uppercase tracking-[0.8em] transition-colors duration-500 ${
                            isDark ? 'text-blue-400/60' : 'text-slate-400'
                        }`}>
                            {subtitulo}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Rodapé Minimalista */}
            <div className="absolute bottom-16 w-full flex justify-center items-center px-20">
                <div className="flex items-center gap-10 opacity-30 group hover:opacity-60 transition-opacity duration-500">
                    <span className={`text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>Metrics Intelligence</span>
                    <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-white' : 'bg-slate-900'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>High Performance</span>
                </div>
            </div>
        </div>
    );
};

export default SlideCapaMarketing;
