'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MarketingMetricCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
    bg: string;
    isDark: boolean;
}

export const MarketingMetricCard: React.FC<MarketingMetricCardProps> = ({
    label,
    value,
    icon: Icon,
    color,
    bg,
    isDark
}) => {
    return (
        <div 
            className={`rounded-[32px] p-8 border shadow-sm transition-all hover:shadow-xl flex flex-col justify-between group ${
                isDark ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/60' : 'bg-white border-slate-100 hover:bg-slate-50'
            }`}
        >
            <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
                <div className={`h-2 w-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            </div>
            
            <div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">
                    {label}
                </p>
                <p className={`text-5xl font-black ${color} tracking-tighter`}>
                    {value.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
};
