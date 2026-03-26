'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FunnelStepProps {
    label: string;
    value: number;
    color: string;
    width: string;
    delay: number;
}

const FunnelStep: React.FC<FunnelStepProps> = ({ label, value, color, width, delay }) => (
    <motion.div 
        initial={{ x: 50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        className="flex flex-col items-end gap-2"
    >
        <div className="flex items-center gap-4 w-full">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest min-w-[100px] text-right">{label}</span>
            <div className="h-12 flex-1 flex justify-end">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width }}
                    transition={{ duration: 1.2, delay: delay + 0.2, ease: 'backOut' }}
                    className={`h-full rounded-l-full relative ${color} shadow-lg`}
                >
                    <div className="absolute inset-y-0 right-6 flex items-center">
                        <span className="text-white font-black text-2xl drop-shadow-md">{value.toLocaleString()}</span>
                    </div>
                    {/* Decorative Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 rounded-l-full" />
                </motion.div>
            </div>
        </div>
    </motion.div>
);

export const MarketingFunnelChart: React.FC<{ totals: any }> = ({ totals }) => {
    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl ml-auto">
            <FunnelStep 
                label="Criados" 
                value={totals.criado} 
                color="bg-blue-600" 
                width="100%" 
                delay={0.1} 
            />
            <FunnelStep 
                label="Enviados" 
                value={totals.enviado} 
                color="bg-blue-500" 
                width="85%" 
                delay={0.2} 
            />
            <FunnelStep 
                label="Liberados" 
                value={totals.liberado} 
                color="bg-purple-600" 
                width="70%" 
                delay={0.3} 
            />
            <FunnelStep 
                label="Unid. Ativas" 
                value={totals.rodandoInicio} 
                color="bg-emerald-600" 
                width="50%" 
                delay={0.4} 
            />
            <div className="mt-4 pr-4 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Fluxo de Conversão Marketing</p>
            </div>
        </div>
    );
};
