'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MarketingCostData } from '@/types';
import { CostsTableRow } from './CostsTableRow';
import { CostsTableFooter } from './CostsTableFooter';

interface CostsTableProps {
    data: MarketingCostData[];
    totals: {
        totalConversas: number;
        totalCPC: number;
        totalValor: number;
        totalCPL: number;
        totalCPA: number;
    };
    isDark: boolean;
}

export const CostsTable: React.FC<CostsTableProps> = ({ data, totals, isDark }) => {
    return (
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
                        {data.length > 0 ? (
                            data.map((row, idx) => (
                                <CostsTableRow key={idx} row={row} idx={idx} isDark={isDark} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-500 text-xl font-medium">
                                    Nenhum dado disponível para este período.
                                </td>
                            </tr>
                        )}
                        
                        <CostsTableFooter {...totals} isDark={isDark} />
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
};
