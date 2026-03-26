'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CostsHeaderProps {
    titulo: string;
    isDark: boolean;
}

export const CostsHeader: React.FC<CostsHeaderProps> = ({ titulo, isDark }) => {
    return (
        <>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-black text-xl tracking-tighter">SH SP</span>
                    <span className={`font-medium text-sm ${isDark ? 'text-blue-400/50' : 'text-blue-500/50'}`}>| Trafego Pago (Custo)</span>
                </div>
                <div className="flex items-center gap-2 scale-75 origin-top-right">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">GO</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mb-4">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-[8rem] font-black leading-none tracking-tighter text-center ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}
                >
                    {titulo}
                </motion.h1>
            </div>
        </>
    );
};
