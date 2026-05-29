import React from 'react';

export const ENTRADA_SAIDA_COLORS = {
    entradas: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-700 dark:text-emerald-300',
        textLight: 'text-emerald-600/70',
    },
    retomada: {
        bg: 'bg-sky-100 dark:bg-sky-900/30',
        icon: 'text-sky-600 dark:text-sky-400',
        text: 'text-sky-700 dark:text-sky-300',
        textLight: 'text-sky-600/70',
    },
    saidas: {
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        icon: 'text-rose-600 dark:text-rose-400',
        text: 'text-rose-700 dark:text-rose-300',
        textLight: 'text-rose-600/70',
    },
};

interface StatProps {
    label: string;
    value: number | string;
    color: { bg: string; icon: string; text: string; textLight: string };
    icon: React.ElementType;
}

export const EntradaSaidaRowStat: React.FC<StatProps> = ({ label, value, color, icon: Icon }) => (
    <div className="flex min-w-[80px] flex-col items-center justify-center">
        <span className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${color.textLight}`}>{label}</span>
        <div className="flex items-center gap-1.5">
            <div className={`rounded-full p-1 ${color.bg}`}>
                <Icon className={`h-3 w-3 ${color.icon}`} />
            </div>
            <span className={`text-base font-bold tabular-nums sm:text-lg ${color.text}`}>{value}</span>
        </div>
    </div>
);
