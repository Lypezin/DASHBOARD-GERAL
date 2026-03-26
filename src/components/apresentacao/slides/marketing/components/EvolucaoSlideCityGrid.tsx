'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MarketingCityData } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkline } from '@/components/ui/Sparkline';
import { CountUp } from '@/components/ui/CountUp';
import { TiltCard } from '@/components/ui/TiltCard';

interface EvolucaoSlideCityGridProps {
    citiesData: MarketingCityData[];
}

export const EvolucaoSlideCityGrid: React.FC<EvolucaoSlideCityGridProps> = React.memo(({ citiesData }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="mt-auto">
            <div className="flex items-center gap-4 mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Distribuição por Unidade</h3>
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>
            
            <div className="grid grid-cols-4 gap-6 px-1">
                {citiesData.map((data, idx) => (
                    <TiltCard key={idx} className="relative group perspective-1000">
                        <motion.div 
                            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 50, 
                                damping: 20, 
                                delay: idx * 0.1 
                            }}
                            viewport={{ once: true }}
                            className={`rounded-2xl p-6 transition-all duration-500 glass-card border border-white/10 ${
                                isDark 
                                ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900/40' 
                                : 'shadow-2xl shadow-slate-200/60 bg-white/70'
                            }`}
                        >
                            <h4 className={`font-black text-xl mb-4 flex justify-between items-center border-b pb-3 ${
                                isDark ? 'text-white border-white/5' : 'text-slate-800 border-slate-100'
                            }`} title={data.cidade}>
                                <div className="flex flex-col flex-1 min-w-0 pr-2">
                                    <span className="text-[17px] leading-tight tracking-tight group-hover:text-blue-500 transition-colors line-clamp-2">{data.cidade}</span>
                                    <div className="mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Sparkline 
                                            data={[data.criado * 0.8, data.criado * 1.1, data.criado * 0.9, data.criado]} 
                                            width={80} 
                                            height={15} 
                                            color={isDark ? '#3b82f6' : '#2563eb'} 
                                            strokeWidth={2}
                                        />
                                    </div>
                                </div>
                                <div className="h-4 w-4 shrink-0 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-glow-pulse" />
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <StatItem label="Criados" value={data.criado} color={isDark ? 'text-blue-400' : 'text-blue-600'} isDark={isDark} />
                                <StatItem label="Enviados" value={data.enviado} color={isDark ? 'text-white' : 'text-slate-700'} isDark={isDark} />
                                <StatItem label="Liberados" value={data.liberado} color="text-blue-500" isDark={isDark} />
                                <StatItem label="Rodando" value={data.rodandoInicio} color="text-emerald-500" isDark={isDark} />
                                <StatItem label="Abertos" value={data.aberto} color="text-slate-500" isDark={isDark} />
                                <StatItem label="Voltou" value={data.voltou} color="text-slate-500" isDark={isDark} />
                            </div>
                        </motion.div>
                    </TiltCard>
                ))}
            </div>
        </div>
    );
});

EvolucaoSlideCityGrid.displayName = 'EvolucaoSlideCityGrid';

const StatItem = React.memo(({ label, value, color, isDark }: { label: string, value: number, color: string, isDark: boolean }) => (
    <div className="flex justify-between items-center group/item transition-colors">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight group-hover/item:text-blue-400 transition-colors">{label}</span>
        <span className={`text-[22px] font-black tabular-nums tracking-tighter ${color} drop-shadow-sm`}>
            <CountUp value={value} />
        </span>
    </div>
));
