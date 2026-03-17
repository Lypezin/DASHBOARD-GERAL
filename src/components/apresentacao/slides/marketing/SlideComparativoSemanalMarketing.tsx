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
    data: WeeklyData[];
    subtitulo?: string; // Ex: "Geral" ou "São Paulo"
}

const SlideComparativoSemanalMarketing: React.FC<SlideComparativoSemanalMarketingProps> = ({
    isVisible,
    data,
    subtitulo = "Geral"
}) => {
    if (!isVisible) return null;

    // Garante que temos exatamente 8 itens para o grid 2x4 (ou o que estiver disponível)
    const displayData = data.slice(0, 8);

    return (
        <div className="w-full h-full bg-white flex flex-col p-12 font-sans overflow-hidden relative">
            {/* Header Estilizado */}
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                        SH SP <span className="text-slate-300">|</span> <span className="text-blue-500 font-medium">Comparativo</span>
                    </h2>
                </div>
                <div className="text-right flex flex-col items-end">
                    <h1 className="text-[100px] font-black text-black leading-[0.8] tracking-tighter uppercase">
                        COMPARATIVO
                    </h1>
                    <span className="text-4xl font-black text-slate-800 tracking-tight mt-[-10px]">
                        {subtitulo}
                    </span>
                </div>
            </div>

            {/* Grid de Semanas */}
            <div className="flex-1 grid grid-cols-4 gap-y-12 gap-x-6">
                {displayData.map((week, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex flex-col shadow-sm"
                    >
                        <h3 className="text-3xl font-black text-[#0A1D47] mb-6 uppercase tracking-tighter border-b border-slate-200 pb-2">
                            {week.semana}
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Criados</span>
                                <span className="text-xl font-black text-slate-700">{week.criado}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enviados</span>
                                <span className="text-xl font-black text-[#3B82F6]">{week.enviado}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liberados</span>
                                <span className="text-xl font-black text-[#3B82F6]">{week.liberado}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rodando</span>
                                <span className="text-xl font-black text-green-600">{week.rodando}</span>
                            </div>
                            
                            {week.conversas !== undefined && (
                                <div className="mt-2 text-blue-500 font-bold text-lg uppercase tracking-tight">
                                    {week.conversas.toLocaleString('pt-BR')} Conversas
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detalhe Decorativo Inferior */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-black opacity-10" />
        </div>
    );
};

export default SlideComparativoSemanalMarketing;
