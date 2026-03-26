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

interface WeeklyPerformanceCardProps {
    week: WeeklyData;
    idx: number;
    isDark: boolean;
}

export const WeeklyPerformanceCard: React.FC<WeeklyPerformanceCardProps> = ({
    week,
    idx,
    isDark
}) => {
    return (
        <motion.div 
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
    );
};
