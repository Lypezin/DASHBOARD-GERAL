'use client';

import React, { useState, useEffect } from 'react';
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


    const totalValor = data.reduce((acc, curr) => acc + (curr.valorUsado || 0), 0);
    const totalRodando = data.reduce((acc, curr) => acc + (curr.rodando || 0), 0);
    const totalLiberados = data.reduce((acc, curr) => acc + (curr.liberado || 0), 0);
    const totalConversas = data.reduce((acc, curr) => acc + (curr.conversas || 0), 0);

    const totalCPA = totalRodando > 0 ? totalValor / totalRodando : 0;
    const totalCPL = totalLiberados > 0 ? totalValor / totalLiberados : 0;
    const totalCPC = totalConversas > 0 ? totalValor / totalConversas : 0;

    return (
        <div className={`w-full h-full flex flex-col p-10 font-sans overflow-hidden relative transition-colors duration-500 ${
            isDark ? 'bg-[#020617]' : 'bg-white'
        }`}>
            {/* Header com Nome da Empresa e Tópico */}
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

            {/* Título Gigante */}
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

            {/* Tabela de Dados */}
            <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[2rem] overflow-hidden border shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] ${
                        isDark ? 'border-slate-800 bg-slate-900/40 backdrop-blur-xl' : 'border-slate-200 bg-white'
                    }`}
                >
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-r border-slate-800/10">Região</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">Conversas</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10 whitespace-nowrap">Custo por Conversa</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">Valor Usado</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">CPL</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-slate-800/10">CPA</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Em aberto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? data.map((row, idx) => {
                                const numConversa = row.conversas || 0;
                                const cpc = numConversa > 0 ? row.valorUsado / numConversa : 0;
                                const cpl = row.liberado > 0 ? row.valorUsado / row.liberado : 0;

                                return (
                                    <motion.tr 
                                        key={idx} 
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 + (idx * 0.05) }}
                                        className={`border-b last:border-0 ${isDark ? 'border-slate-800' : 'border-slate-100'} hover:bg-blue-500/5 transition-colors`}
                                    >
                                        <td className="px-5 py-4 text-sm font-bold border-r border-slate-800/5">{row.regiao}</td>
                                        <td className="px-5 py-4 text-sm text-center font-bold border-r border-slate-800/5">
                                            {row.conversas || '-'}
                                        </td>
                                        <td className={`px-5 py-4 text-sm text-center font-bold border-r border-slate-800/5 ${cpc > 0 ? (isDark ? 'text-blue-300' : 'text-blue-500') : 'text-slate-400'}`}>
                                            {cpc > 0 ? cpc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ -'}
                                        </td>
                                        <td className={`px-5 py-4 text-base text-center font-bold border-r border-slate-800/5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {row.valorUsado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className={`px-5 py-4 text-sm text-center font-bold border-r border-slate-800/5 ${cpl > 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-400'}`}>
                                            {cpl > 0 ? cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ -'}
                                        </td>
                                        <td className="px-5 py-4 text-base text-center font-black border-r border-slate-800/5">
                                            {row.cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-5 py-4 text-lg text-center font-black text-emerald-500">
                                            {row.aberto || '-'}
                                        </td>
                                    </motion.tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 text-xl font-medium">
                                        Nenhum dado disponível para este período.
                                    </td>
                                </tr>
                            )}
                            
                            {/* Linha de Engajamento */}
                            <tr className={`${isDark ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}>
                                <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 border-r border-slate-800/5">Engajamento</td>
                                <td colSpan={6} className="px-5 py-3 text-sm text-center font-bold text-slate-400">R$ 0</td>
                            </tr>
                            
                            {/* Footer/Total */}
                            <tr className="bg-blue-600 text-white">
                                <td className="px-5 py-4 text-lg font-black uppercase tracking-[0.2em] border-r border-white/10">Total</td>
                                <td className="px-5 py-4 text-lg text-center font-black border-r border-white/10">
                                    {totalConversas || '-'}
                                </td>
                                <td className="px-5 py-4 text-lg text-center font-black border-r border-white/10">
                                    {totalCPC > 0 ? totalCPC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                </td>
                                <td className="px-5 py-4 text-xl text-center font-black border-r border-white/10">
                                    {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-5 py-4 text-lg text-center font-black border-r border-white/10">
                                    {totalCPL > 0 ? totalCPL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                </td>
                                <td className="px-5 py-4 text-xl text-center font-black border-r border-white/10">
                                    {totalCPA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-5 py-4 text-lg text-center font-black">-</td>
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
