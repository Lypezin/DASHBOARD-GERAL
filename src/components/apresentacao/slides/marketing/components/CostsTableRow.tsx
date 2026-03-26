'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MarketingCostData } from '@/types';

interface CostsTableRowProps {
    row: MarketingCostData;
    idx: number;
    isDark: boolean;
}

export const CostsTableRow: React.FC<CostsTableRowProps> = ({ row, idx, isDark }) => {
    const numConversa = row.conversas || 0;
    const cpc = numConversa > 0 ? row.valorUsado / numConversa : 0;
    const cpl = row.liberado > 0 ? row.valorUsado / row.liberado : 0;

    return (
        <motion.tr 
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
};
