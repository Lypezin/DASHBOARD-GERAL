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
        <div className="relative w-full h-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden flex flex-col items-center justify-center p-20 font-sans">
            {/* Background Animado - Formas Abstratas */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[120px]"
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                    opacity: [0.03, 0.08, 0.03]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px]"
            />

            {/* Barras Decorativas Minimalistas */}
            <div className="absolute left-0 top-0 h-full flex items-stretch">
                <div className="w-2 bg-blue-600 opacity-40" />
                <div className="w-4 bg-blue-500 mx-1 opacity-20" />
                <div className="w-8 bg-blue-400 opacity-10" />
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
                <h1 className="text-[84px] font-black text-white leading-tight mb-2 tracking-tighter">
                    {titulo}
                </h1>
                <h2 className="text-[48px] font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight mb-8">
                    {periodo}
                </h2>
                
                {subtitulo && (
                    <div className="flex flex-col items-center">
                        <div className="h-1.5 w-32 bg-blue-500 rounded-full mb-8 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                        <p className="text-xl text-slate-400 font-black uppercase tracking-[0.5em] opacity-80">
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
