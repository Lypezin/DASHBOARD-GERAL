import React from 'react';

export const ENTRADA_SAIDA_COLORS = {
    entradas: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300', textLight: 'text-emerald-600/70' },
    retomada: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-300', textLight: 'text-indigo-600/70' },
    saidas: { bg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', text: 'text-rose-700 dark:text-rose-300', textLight: 'text-rose-600/70' },
};

interface StatProps {
    label: string;
    value: number | string;
    color: { bg: string; icon: string; text: string; textLight: string };
    icon: React.ElementType;
}

export const EntradaSaidaRowStat: React.FC<StatProps> = ({ label, value, color, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center min-w-[80px]">
        <span className={`text-[10px] uppercase font-bold tracking-wider ${color.textLight} mb-0.5`}>{label}</span>
        <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-full ${color.bg}`}>
                <Icon className={`w-3 h-3 ${color.icon}`} />
            </div>
            <span className={`text-lg font-bold ${color.text} tabular-nums`}>{value}</span>
        </div>
    </div>
);
