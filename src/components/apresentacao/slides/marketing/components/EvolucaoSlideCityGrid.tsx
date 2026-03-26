'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MarketingCityData } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface EvolucaoSlideCityGridProps {
    citiesData: MarketingCityData[];
}

export const EvolucaoSlideCityGrid: React.FC<EvolucaoSlideCityGridProps> = ({ citiesData }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="mt-auto">
            <div className="flex items-center gap-4 mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Distribuição por Unidade</h3>
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>
            
            <div className="grid grid-cols-4 gap-4 px-1">
                {citiesData.map((data, idx) => (
                    <motion.div 
                        key={idx} 
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`rounded-xl p-6 border transition-all duration-300 ${
                            isDark 
                            ? 'bg-slate-900/40 border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.3)]' 
                            : 'bg-white border-slate-100 shadow-md hover:shadow-lg'
                        }`}
                    >
                        <h4 className={`font-black text-xl mb-4 flex justify-between items-center border-b pb-3 ${
                            isDark ? 'text-white border-slate-800' : 'text-slate-800 border-slate-100'
                        }`} title={data.cidade}>
                            <span className="truncate pr-2">{data.cidade}</span>
                            <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                            <StatItem label="Criados" value={data.criado} color={isDark ? 'text-blue-400' : 'text-blue-600'} isDark={isDark} />
                            <StatItem label="Enviados" value={data.enviado} color={isDark ? 'text-slate-300' : 'text-slate-700'} isDark={isDark} />
                            <StatItem label="Liberados" value={data.liberado} color="text-blue-500" isDark={isDark} />
                            <StatItem label="Rodando" value={data.rodandoInicio} color="text-emerald-500" isDark={isDark} />
                            <StatItem label="Abertos" value={data.aberto} color="text-slate-500" isDark={isDark} />
                            <StatItem label="Voltou" value={data.voltou} color="text-slate-500" isDark={isDark} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const StatItem = ({ label, value, color, isDark }: { label: string, value: number, color: string, isDark: boolean }) => (
    <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">{label}</span>
        <span className={`text-xl font-black ${color}`}>{value}</span>
    </div>
);
