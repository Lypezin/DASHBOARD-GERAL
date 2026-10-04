'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CapaTitleProps {
    titulo: string;
    subtitulo?: string;
    periodo?: string;
    isDark: boolean;
}

export const CapaTitle: React.FC<CapaTitleProps> = ({ 
    titulo, 
    subtitulo, 
    periodo, 
    isDark 
}) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div 
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center z-10 max-w-5xl"
        >
            <motion.div 
                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.15 }}
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
                        initial={shouldReduceMotion ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: shouldReduceMotion ? 0 : 0.35 }}
                        className="h-[6px] w-[120px] origin-left rounded-full bg-blue-600 mb-10 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    />
                    <p className={`text-xl font-bold uppercase tracking-[0.8em] transition-colors duration-500 ${
                        isDark ? 'text-blue-400/60' : 'text-slate-400'
                    }`}>
                        {subtitulo}
                    </p>
                </div>
            )}
        </motion.div>
    );
};
