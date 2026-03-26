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
    { id: 'resumo', label: 'Resumo', icon: LayoutGrid, color: 'text-teal-500' },
    { id: 'unidades', label: 'Unidades', icon: MapPin, color: 'text-purple-500' },
    { id: 'custos', label: 'Custos', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'semanal', label: 'Evolução', icon: TrendingUp, color: 'text-orange-500' },
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
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1001]"
        >
            <div className="glass-card flex items-center gap-2 p-2 rounded-2xl shadow-2xl border-white/5 bg-slate-900/40 backdrop-blur-xl">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="group relative p-4 rounded-xl transition-all duration-300 hover:bg-white/5 active:scale-90"
                        title={item.label}
                    >
                        <item.icon className={`h-5 w-5 ${item.color} transition-all duration-300 group-hover:scale-110`} />
                        
                        {/* Tooltip */}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-900/90 text-[10px] text-white font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/5">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};
