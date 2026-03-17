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
            {/* Barras Decorativas Minimalistas */}
            <div className="absolute left-0 top-0 h-full flex items-stretch">
                <div className="w-2 bg-[#0A1D47]" />
                <div className="w-4 bg-[#1e40af] mx-1 opacity-20" />
                <div className="w-12 bg-slate-100" />
            </div>

            {/* Elemento Decorativo Abstrato (Substituindo Logo) */}
            <div className="absolute top-16 right-20 opacity-10">
                 <div className="w-64 h-64 border-[16px] border-blue-900 rounded-full" />
                 <div className="w-32 h-32 border-[8px] border-blue-600 rounded-full absolute -top-10 -left-10" />
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

            {/* Rodapé Decorativo */}
            <div className="absolute bottom-12 right-12 text-slate-300 font-bold uppercase tracking-[0.5em] text-sm">
                 Status Performance Report
            </div>
        </div>
    );
};

export default SlideCapaMarketing;
