'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { MarketingCostData } from '@/types';

interface SlideComparativoCustosMarketingProps {
    isVisible: boolean;
    titulo: string; // Ex: "ATUAL" ou "PASSADA"
    data: MarketingCostData[];
}

const SlideComparativoCustosMarketing: React.FC<SlideComparativoCustosMarketingProps> = ({
    isVisible,
    titulo,
    data = []
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isVisible) return null;

    const totalValor = data.reduce((acc, curr) => acc + curr.valorUsado, 0);
    const totalRodando = data.reduce((acc, curr) => acc + curr.rodando, 0);
    const totalCPA = totalRodando > 0 ? totalValor / totalRodando : 0;

    return (
        <div className={`w-full h-full flex flex-col p-14 font-sans overflow-hidden relative transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-white'
        }`}>
            {/* Header com Nome da Empresa e Tópico */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-black text-2xl tracking-tighter">SH SP</span>
                    <span className={`font-medium ${isDark ? 'text-blue-400/60' : 'text-blue-500/60'}`}>| Trafego Pago (Custo)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">GO</span>
                    </div>
                </div>
            </div>

            {/* Título Gigante */}
            <div className="flex justify-center mb-8">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-[10rem] font-black leading-none tracking-tighter text-center ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}
                >
                    {titulo}
                </motion.h1>
            </div>

            {/* Tabela de Dados */}
            <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[2.5rem] overflow-hidden border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] ${
                        isDark ? 'border-slate-800 bg-slate-900/40 backdrop-blur-xl' : 'border-slate-200 bg-white'
                    }`}
                >
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] border-r border-slate-800/10">Região</th>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">Conversa</th>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10 whitespace-nowrap">Custo por conversa</th>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">Valor Usado</th>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">CPL</th>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">CPA</th>
                                <th className="p-6 text-base font-black uppercase tracking-[0.2em] text-center">Em aberto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? data.map((row, idx) => (
                                <tr key={idx} className={`border-b last:border-0 ${isDark ? 'border-slate-800' : 'border-slate-100'} hover:bg-blue-500/5 transition-colors`}>
                                    <td className="p-6 text-xl font-bold border-r border-slate-800/5">{row.regiao}</td>
                                    <td className="p-6 text-xl text-center text-slate-400 font-medium border-r border-slate-800/5">-</td>
                                    <td className="p-6 text-xl text-center text-slate-400 font-medium border-r border-slate-800/5">R$ -</td>
                                    <td className={`p-6 text-2xl text-center font-bold border-r border-slate-800/5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {row.valorUsado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-6 text-xl text-center text-slate-400 font-medium border-r border-slate-800/5">R$ -</td>
                                    <td className="p-6 text-2xl text-center font-black border-r border-slate-800/5">
                                        {row.cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-6 text-2xl text-center font-black text-emerald-500">
                                        {row.aberto || '-'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 text-xl font-medium">
                                        Nenhum dado disponível para este período.
                                    </td>
                                </tr>
                            )}
                            
                            {/* Linha de Engajamento */}
                            <tr className={`${isDark ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}>
                                <td className="p-6 text-sm font-bold uppercase tracking-[0.3em] text-slate-500 border-r border-slate-800/5">Engajamento</td>
                                <td colSpan={6} className="p-6 text-xl text-center font-bold text-slate-400">R$ 0</td>
                            </tr>
                            
                            {/* Footer/Total */}
                            <tr className="bg-blue-600 text-white">
                                <td className="p-6 text-2xl font-black uppercase tracking-[0.2em] border-r border-white/10">Total</td>
                                <td className="p-6 text-2xl text-center font-black border-r border-white/10">-</td>
                                <td className="p-6 text-2xl text-center font-black border-r border-white/10">R$ -</td>
                                <td className="p-6 text-3xl text-center font-black border-r border-white/10">
                                    {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="p-6 text-2xl text-center font-black border-r border-white/10">R$ -</td>
                                <td className="p-6 text-3xl text-center font-black border-r border-white/10">
                                    {totalCPA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="p-6 text-2xl text-center font-black">-</td>
                            </tr>
                        </tbody>
                    </table>
                </motion.div>
            </div>
            
            {/* Decorativo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full -mr-48 -mt-48 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full -ml-48 -mb-48 blur-3xl" />
        </div>
    );
};

export default SlideComparativoCustosMarketing;
