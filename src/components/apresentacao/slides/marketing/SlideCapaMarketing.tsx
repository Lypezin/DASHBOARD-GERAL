'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
    if (!isVisible) return null;

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-white overflow-hidden flex flex-col items-center justify-center p-20 font-sans">
            {/* Barras Azuis Laterais - Cores da Marca */}
            <div className="absolute left-0 top-0 h-full flex items-stretch">
                <div className="w-2 bg-[#0A1D47]" />
                <div className="w-4 bg-[#1e40af] mx-1 opacity-80" />
                <div className="w-8 bg-[#3b82f6] opacity-60" />
            </div>

            {/* Logo EntreGO (Topo Esquerda) */}
            <div className="absolute top-12 left-24 flex items-center gap-2">
                <div className="flex items-baseline">
                    <span className="text-[44px] font-black text-[#0A1D47] tracking-tight">Entre</span>
                    <span className="text-[44px] font-black text-[#0A1D47] tracking-tight">G</span>
                    <div className="relative inline-flex items-center justify-center ml-[-2px]">
                         <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                         </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Central */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center z-10"
            >
                <h1 className="text-[72px] font-black text-[#0A1D47] leading-tight mb-2 tracking-tighter">
                    {titulo}
                </h1>
                <h2 className="text-[42px] font-bold text-blue-600 tracking-tight mb-8">
                    {periodo}
                </h2>
                
                {subtitulo && (
                    <div className="flex flex-col items-center">
                        <div className="h-1.5 w-24 bg-[#0A1D47] rounded-full mb-6" />
                        <p className="text-xl text-slate-400 font-bold uppercase tracking-[0.3em]">
                            {subtitulo}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Rodapé ou Detalhe Extra */}
            <div className="absolute bottom-12 right-12 opacity-20 transform rotate-[-5deg]">
                 <svg viewBox="0 0 24 24" className="w-24 h-24 text-blue-900 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
            </div>
        </div>
    );
};

export default SlideCapaMarketing;
