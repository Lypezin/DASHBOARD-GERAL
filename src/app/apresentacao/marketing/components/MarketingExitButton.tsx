'use client';

import React from 'react';
import { X } from 'lucide-react';

interface MarketingExitButtonProps {
    onExit: () => void;
    theme: string;
}

export const MarketingExitButton: React.FC<MarketingExitButtonProps> = ({ onExit, theme }) => {
    return (
        <div className="fixed right-3 top-3 z-[9999] print:hidden sm:right-8 sm:top-8">
            <button 
                onClick={onExit}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-xs font-black tracking-[0.2em] backdrop-blur-2xl transition-all active:scale-95 sm:px-6 sm:py-3 ${
                    theme === 'dark'
                    ? 'bg-slate-900/60 border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    : 'bg-white/60 border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:bg-white/80 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                }`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <X size={20} className="group-hover:rotate-90 transition-transform duration-500 text-blue-400" />
                <span className="relative z-10 hidden text-xs sm:inline">SAIR DA APRESENTAÇÃO</span>
            </button>
        </div>
    );
};
