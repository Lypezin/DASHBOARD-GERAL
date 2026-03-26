'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, MapPin, DollarSign, TrendingUp, Home } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: any;
    color: string;
}

const navItems: NavItem[] = [
    { id: 'top', label: 'Capa', icon: Home, color: 'text-blue-500' },
    { id: 'unidades', label: 'Unidades', icon: MapPin, color: 'text-purple-500' },
    { id: 'semanal', label: 'Evolução', icon: TrendingUp, color: 'text-orange-500' },
    { id: 'custos', label: 'Custos', icon: DollarSign, color: 'text-emerald-500' },
];

export const MarketingFloatingNav: React.FC = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else if (id === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="fixed top-24 left-0 right-0 flex justify-center z-[10000] pointer-events-none">
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="glass-card flex items-center gap-1.5 p-1.5 rounded-2xl shadow-2xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl pointer-events-auto"
            >
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="group relative p-3.5 rounded-xl transition-all duration-300 hover:bg-white/10 active:scale-95"
                    >
                        <item.icon className="h-5 w-5 text-slate-400 transition-all duration-300 group-hover:text-blue-400 group-hover:scale-110" />
                        
                        {/* Tooltip sofisticado (agora embaixo) */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0 group-hover:translate-y-2 mt-2">
                            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-lg shadow-xl">
                                <span className="text-[10px] text-white font-black uppercase tracking-[0.2em] whitespace-nowrap">
                                    {item.label}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </motion.div>
        </div>
    );
};
