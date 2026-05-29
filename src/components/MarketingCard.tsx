'use client';

import React from 'react';

interface MarketingCardProps {
    title: string;
    value: number;
    icon: string;
    color?: 'blue' | 'green' | 'purple' | 'orange';
    formatCurrency?: boolean;
}

const MarketingCard: React.FC<MarketingCardProps> = ({
    title,
    value,
    icon,
    color = 'blue',
    formatCurrency = false,
}) => {
    const formatValue = (val: number): string => {
        if (formatCurrency) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(val);
        }
        return val.toLocaleString('pt-BR');
    };

    const colorClasses: Record<string, { gradient: string; bg: string; text: string }> = {
        blue: {
            gradient: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            text: 'text-blue-700 dark:text-blue-300',
        },
        green: {
            gradient: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            text: 'text-emerald-700 dark:text-emerald-300',
        },
        purple: {
            gradient: 'from-sky-500 to-blue-500',
            bg: 'bg-sky-50 dark:bg-sky-950/30',
            text: 'text-sky-700 dark:text-sky-300',
        },
        orange: {
            gradient: 'from-orange-500 to-amber-500',
            bg: 'bg-orange-50 dark:bg-orange-950/30',
            text: 'text-orange-700 dark:text-orange-300',
        },
    };

    const colors = colorClasses[color];

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/85 sm:p-5 md:p-6">
            <div className={`pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-3xl transition-opacity group-hover:opacity-20 sm:h-40 sm:w-40 ${colors.gradient}`} />

            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 overflow-hidden pr-2 sm:pr-3">
                    <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">{title}</p>
                    <p
                        className="mt-1 break-words text-xl font-bold leading-tight text-slate-900 transition-transform group-hover:scale-[1.01] dark:text-white sm:mt-2 sm:text-2xl md:text-3xl"
                        style={{ fontVariantNumeric: 'tabular-nums', wordBreak: 'break-word' }}
                    >
                        {formatValue(value)}
                    </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white shadow-md ring-2 ring-white/20 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl md:h-14 md:w-14 md:text-2xl ${colors.gradient}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default MarketingCard;
