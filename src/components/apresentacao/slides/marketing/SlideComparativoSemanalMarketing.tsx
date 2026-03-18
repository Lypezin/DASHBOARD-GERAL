'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
    if (!isVisible) return null;

    return (
        <div className="w-full h-full bg-[#f8fafc] flex flex-col p-14 font-sans overflow-hidden relative">
            {/* Header Sofisticado */}
            <div className="flex justify-between items-end mb-12 border-b-2 border-slate-200 pb-8">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-[2px] bg-blue-600" />
                        <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Análise Temporal</span>
                    </div>
                    <h1 className="text-7xl font-bold text-slate-900 leading-none tracking-tight">
                        {titulo}
                    </h1>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-light text-slate-400 tracking-tight block mb-1">
                        UNIDADE
                    </span>
                    <span className="text-3xl font-bold text-slate-800 tracking-tighter uppercase">
                        {subtitulo}
                    </span>
                </div>
            </div>

            {/* Grid de Semanas Minimalista */}
            <div className="flex-1 grid grid-cols-4 gap-6">
                {weeklyData.slice(0, 8).map((week, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
                                {week.semana}
                            </h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Criados</span>
                                <span className="text-xl font-bold text-slate-600">{week.criado}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enviados</span>
                                <span className="text-xl font-bold text-blue-600">{week.enviado}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liberados</span>
                                <span className="text-xl font-bold text-emerald-600">{week.liberado}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rodando</span>
                                <span className="text-xl font-bold text-indigo-600">{week.rodando}</span>
                            </div>
                            
                            {week.conversas !== undefined && (
                                <div className="mt-4 pt-4 border-t-2 border-blue-50">
                                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Interações</div>
                                    <div className="text-2xl font-bold text-blue-600 tracking-tighter">
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
                <div className="h-[1px] w-12 bg-slate-400" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em]">Weekly Performance Audit</span>
            </div>
        </div>
    );
};

export default SlideComparativoSemanalMarketing;
