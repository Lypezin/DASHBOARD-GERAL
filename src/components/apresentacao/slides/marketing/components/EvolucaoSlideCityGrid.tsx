'use client';

import { motion } from 'framer-motion';
import { MarketingCityData } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkline } from '@/components/ui/Sparkline';

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
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        viewport={{ once: true }}
                        className={`rounded-2xl p-6 transition-all duration-300 glass-card ${
                            isDark 
                            ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
                            : 'shadow-xl shadow-slate-200/50'
                        }`}
                    >
                        <h4 className={`font-black text-xl mb-4 flex justify-between items-center border-b pb-3 ${
                            isDark ? 'text-white border-white/5' : 'text-slate-800 border-slate-100'
                        }`} title={data.cidade}>
                            <div className="flex flex-col">
                                <span className="truncate pr-2">{data.cidade}</span>
                                <div className="mt-1">
                                    <Sparkline 
                                        data={[data.criado * 0.8, data.criado * 1.1, data.criado * 0.9, data.criado]} 
                                        width={80} 
                                        height={15} 
                                        color={isDark ? '#3b82f6' : '#2563eb'} 
                                    />
                                </div>
                            </div>
                            <div className="h-3 w-3 shrink-0 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse" />
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                            <StatItem label="Criados" value={data.criado} color={isDark ? 'text-blue-400' : 'text-blue-600'} isDark={isDark} />
                            <StatItem label="Enviados" value={data.enviado} color={isDark ? 'text-slate-200' : 'text-slate-700'} isDark={isDark} />
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
