'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
    compact?: boolean;
}

export const WeeklyPerformanceCard: React.FC<WeeklyPerformanceCardProps> = ({
    week,
    idx,
    isDark,
    compact = false
}) => {
    const shouldReduceMotion = useReducedMotion();
    return (
        <motion.div 
            whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, delay: shouldReduceMotion ? 0 : idx * 0.04 }}
            className={`rounded-2xl border flex flex-col transition-all duration-300 ${
                compact ? 'p-3.5 md:p-4 gap-1.5' : 'p-6'
            } ${
                isDark 
                ? 'bg-slate-900/40 border-slate-800 shadow-[0_12px_40px_rgb(0,0,0,0.3)] hover:bg-slate-900/60' 
                : 'bg-white border-slate-100 shadow-md hover:shadow-2xl hover:bg-slate-50'
            }`}
        >
            <div className={`flex items-center gap-2 mb-2`}>
                <span className={`w-1 bg-blue-600 rounded-full ${compact ? 'h-3.5' : 'h-5'}`} />
                <h3 className={`font-black tracking-tight uppercase transition-colors duration-500 ${
                    compact ? 'text-xs md:text-sm' : 'text-lg'
                } ${
                    isDark ? 'text-white' : 'text-slate-800'
                }`}>
                    {week.semana}
                </h3>
            </div>
            
            <div className={`${compact ? 'mt-2 space-y-2.5' : 'mt-5 space-y-4'}`}>
                <div className="flex justify-between items-center text-slate-400">
                    <span className={`font-bold uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Criados</span>
                    <span className={`font-black ${compact ? 'text-sm md:text-base' : 'text-xl'} ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{week.criado}</span>
                </div>
                <div className="flex justify-between items-center text-blue-600">
                    <span className={`font-bold uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Enviados</span>
                    <span className={`font-black ${compact ? 'text-sm md:text-base' : 'text-xl'}`}>{week.enviado}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600">
                    <span className={`font-bold uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Liberados</span>
                    <span className={`font-black ${compact ? 'text-sm md:text-base' : 'text-xl'}`}>{week.liberado}</span>
                </div>
                <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} text-indigo-600`}>
                    <span className={`font-bold uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Rodando</span>
                    <span className={`font-black ${compact ? 'text-sm md:text-base' : 'text-xl'}`}>{week.rodando}</span>
                </div>
                
                {week.conversas !== undefined && (
                    <div className={`pt-1.5 border-t ${isDark ? 'border-blue-900/40' : 'border-blue-100'} ${compact ? 'mt-1' : 'mt-2'}`}>
                        <div className={`font-bold text-blue-400 uppercase tracking-widest mb-0.5 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>Conversas</div>
                        <div className={`font-black tracking-tighter transition-colors duration-500 ${
                            compact ? 'text-sm md:text-base' : 'text-xl'
                        } ${
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
