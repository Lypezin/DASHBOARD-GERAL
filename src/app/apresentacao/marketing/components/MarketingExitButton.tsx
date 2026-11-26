'use client';

import React from 'react';
import { X } from 'lucide-react';

interface MarketingExitButtonProps {
    onExit: () => void;
    theme: string;
}

export const MarketingExitButton: React.FC<MarketingExitButtonProps> = ({ onExit, theme }) => {
    return (
        <div className="fixed right-3 top-3 z-[10010] print:hidden sm:right-8 sm:top-8">
            <button
                type="button"
                aria-label="Sair da apresentação"
                onClick={onExit}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-xs font-black tracking-[0.2em] backdrop-blur-2xl transition-[background-color,border-color,box-shadow,transform] duration-200 motion-safe:active:scale-95 sm:px-6 sm:py-3 ${
                    theme === 'dark'
                    ? 'bg-slate-900/60 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    : 'bg-white/60 border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:bg-white/80 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                }`}
            >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 motion-safe:group-hover:translate-x-full" />
                
                <X size={20} className="text-blue-400 transition-transform duration-500 motion-safe:group-hover:rotate-90" aria-hidden="true" />
                <span className="relative z-10 hidden text-xs sm:inline">SAIR DA APRESENTAÇÃO</span>
            </button>
        </div>
    );
};
