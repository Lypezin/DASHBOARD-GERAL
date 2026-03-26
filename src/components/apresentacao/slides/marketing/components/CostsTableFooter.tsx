'use client';

import React from 'react';

interface CostsTableFooterProps {
    totalConversas: number;
    totalCPC: number;
    totalValor: number;
    totalCPL: number;
    totalCPA: number;
    isDark: boolean;
}

export const CostsTableFooter: React.FC<CostsTableFooterProps> = ({
    totalConversas,
    totalCPC,
    totalValor,
    totalCPL,
    totalCPA,
    isDark
}) => {
    return (
        <tfoot>
            <tr className={`${isDark ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}>
                <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 border-r border-slate-800/5">Engajamento</td>
                <td colSpan={6} className="px-5 py-3 text-sm text-center font-bold text-slate-400">R$ 0</td>
            </tr>
            
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
        </tfoot>
    );
};
