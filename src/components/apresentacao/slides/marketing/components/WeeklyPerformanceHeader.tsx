'use client';

import React from 'react';

interface WeeklyPerformanceHeaderProps {
    titulo: string;
    subtitulo: string;
    isDark: boolean;
}

export const WeeklyPerformanceHeader: React.FC<WeeklyPerformanceHeaderProps> = ({
    titulo,
    subtitulo,
    isDark
}) => {
    return (
        <div className={`flex justify-between items-end mb-6 border-b-2 pb-4 transition-colors duration-500 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-[2.5px] bg-blue-600" />
                    <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[9px]">Análise Temporal</span>
                </div>
                <h1 className={`text-5xl font-black leading-none tracking-tight transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-900'
                }`}>
                    {titulo}
                </h1>
            </div>
            <div className="text-right">
                <span className={`text-2xl font-light tracking-tight block mb-0.5 transition-colors duration-500 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                    UNIDADE
                </span>
                <span className={`text-xl font-black tracking-tighter uppercase transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-800'
                }`}>
                    {subtitulo}
                </span>
            </div>
        </div>
    );
};
