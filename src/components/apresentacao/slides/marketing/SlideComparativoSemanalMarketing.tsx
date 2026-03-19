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
        <div className={`w-full h-full flex flex-col p-14 font-sans overflow-hidden relative transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'
        }`}>
            {/* Header Sofisticado */}
            <div className={`flex justify-between items-end mb-12 border-b-2 pb-8 transition-colors duration-500 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-[2px] bg-blue-600" />
                        <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Análise Temporal</span>
                    </div>
                    <h1 className={`text-7xl font-bold leading-none tracking-tight transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                        {titulo}
                    </h1>
                </div>
                <div className="text-right">
                    <span className={`text-4xl font-light tracking-tight block mb-1 transition-colors duration-500 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                        UNIDADE
                    </span>
                    <span className={`text-3xl font-bold tracking-tighter uppercase transition-colors duration-500 ${
                        isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                        {subtitulo}
                    </span>
                </div>
            </div>

            {/* Grid de Semanas Minimalista */}
            <div className="flex-1 grid grid-cols-4 gap-6">
                {weeklyData.slice(0, 8).map((week, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -4, scale: 1.02 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`rounded-2xl p-6 border flex flex-col transition-all duration-300 ${
                            isDark 
                            ? 'bg-slate-900/40 border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-slate-900/60' 
                            : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                            <h3 className={`text-2xl font-bold tracking-tight uppercase transition-colors duration-500 ${
                                isDark ? 'text-white' : 'text-slate-800'
                            }`}>
                                {week.semana}
                            </h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Criados</span>
                                <span className={`text-xl font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{week.criado}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enviados</span>
                                <span className="text-xl font-bold text-blue-600">{week.enviado}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liberados</span>
                                <span className="text-xl font-bold text-emerald-600">{week.liberado}</span>
                            </div>
                            <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rodando</span>
                                <span className="text-xl font-bold text-indigo-600">{week.rodando}</span>
                            </div>
                            
                            {week.conversas !== undefined && (
                                <div className={`mt-4 pt-4 border-t-2 ${isDark ? 'border-blue-900/30' : 'border-blue-50'}`}>
                                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Interações</div>
                                    <div className={`text-2xl font-bold tracking-tighter transition-colors duration-500 ${
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
            <div className="absolute bottom-10 left-14 flex items-center gap-4 opacity-30">
                <div className={`h-[1px] w-12 ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-[0.4em] transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-500'
                }`}>Weekly Performance Audit</span>
            </div>
        </div>
    );
};

export default SlideComparativoSemanalMarketing;
