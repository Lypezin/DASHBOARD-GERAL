'use client';

import React from 'react';

interface CapaFooterProps {
    isDark: boolean;
}

export const CapaFooter: React.FC<CapaFooterProps> = ({ isDark }) => {
    return (
        <div className="absolute bottom-16 w-full flex justify-center items-center px-20">
            <div className="flex items-center gap-10 opacity-30 group hover:opacity-60 transition-opacity duration-500">
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-900'
                }`}>Metrics Intelligence</span>
                <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-white' : 'bg-slate-900'}`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-colors duration-500 ${
                    isDark ? 'text-white' : 'text-slate-900'
                }`}>High Performance</span>
            </div>
        </div>
    );
};
