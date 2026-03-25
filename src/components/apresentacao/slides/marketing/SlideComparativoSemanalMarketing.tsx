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
            {/* Header Sofisticado - Mais Compacto */}
            <div className={`flex justify-between items-end mb-6 border-b-2 pb-4 transition-colors duration-500 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-[2.5px] bg-blue-600" />
                        <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[9px]">Análise Temporal</span>
                    </div>
                    <h1 className={`text-5xl font-black leading-none tracking-tight transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                        {titulo}
                    </h1>
                </div>
                <div className="text-right">
                    <span className={`text-2xl font-light tracking-tight block mb-0.5 transition-colors duration-500 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                        UNIDADE
                    </span>
                    <span className={`text-xl font-black tracking-tighter uppercase transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                        {subtitulo}
                    </span>
                </div>
            </div>

            {/* Grid de Semanas Minimalista - Gap reduzido */}
            <div className="flex-1 grid grid-cols-4 gap-4 pb-12">
                {weeklyData.slice(0, 8).map((week, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -4, scale: 1.01 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`rounded-2xl p-5 border flex flex-col transition-all duration-300 ${
                            isDark 
                            ? 'bg-slate-900/40 border-slate-800 shadow-[0_12px_40px_rgb(0,0,0,0.3)] hover:bg-slate-900/60' 
                            : 'bg-white border-slate-100 shadow-md hover:shadow-2xl hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full" />
                            <h3 className={`text-lg font-black tracking-tight uppercase transition-colors duration-500 ${
                                isDark ? 'text-white' : 'text-slate-800'
                            }`}>
                                {week.semana}
                            </h3>
                        </div>
                        
                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Criados</span>
                                <span className={`text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{week.criado}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-600">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Enviados</span>
                                <span className="text-xl font-black">{week.enviado}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Liberados</span>
                                <span className="text-xl font-black">{week.liberado}</span>
                            </div>
                            <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} text-indigo-600`}>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Rodando</span>
                                <span className="text-xl font-black">{week.rodando}</span>
                            </div>
                            
                            {week.conversas !== undefined && (
                                <div className={`mt-2 pt-2 border-t ${isDark ? 'border-blue-900/40' : 'border-blue-100'}`}>
                                    <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Conversas</div>
                                    <div className={`text-xl font-black tracking-tighter transition-colors duration-500 ${
                                        isDark ? 'text-blue-400' : 'text-blue-600'
                                    }`}>
                                        {week.conversas.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Minimalista */}
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
