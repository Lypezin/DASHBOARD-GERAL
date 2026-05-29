
import React from 'react';

interface MetricDetailListProps {
    title: string;
    items: string[];
    type: 'marketing' | 'operacional' | 'marketing-novos' | 'operacional-novos';
    isEntrada: boolean;
}

export const MetricDetailList: React.FC<MetricDetailListProps> = ({ title, items, type, isEntrada }) => {
    if (items.length === 0) return null;

    let colorClass = '';
    let dotColor = '';
    let borderColor = '';
    let bgColor = '';
    let itemTextColor = 'text-slate-700 dark:text-slate-300';
    let isDashed = false;

    switch (type) {
        case 'marketing':
            colorClass = isEntrada ? 'text-emerald-400' : 'text-rose-400';
            dotColor = isEntrada ? 'bg-emerald-500' : 'bg-rose-500';
            borderColor = isEntrada ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-rose-100 dark:border-rose-900/30';
            bgColor = 'bg-white dark:bg-slate-800';
            break;
        case 'operacional':
            colorClass = 'text-slate-500 dark:text-slate-400';
            dotColor = isEntrada ? 'bg-emerald-300' : 'bg-rose-300';
            borderColor = 'border-slate-200 dark:border-slate-700';
            bgColor = 'bg-slate-100/50 dark:bg-slate-800/50';
            itemTextColor = 'text-slate-600 dark:text-slate-400';
            break;
        case 'marketing-novos':
            colorClass = 'text-rose-600/70';
            dotColor = 'bg-amber-500'; // Not used in this style but consistent prop
            borderColor = 'border-amber-100 dark:border-amber-900/30';
            bgColor = 'bg-amber-50 dark:bg-amber-900/10';
            break;
        case 'operacional-novos':
            colorClass = 'text-slate-500/70';
            dotColor = 'bg-amber-500'; // Not used
            borderColor = 'border-slate-200 dark:border-slate-700';
            bgColor = 'bg-slate-100/50 dark:bg-slate-800/50';
            itemTextColor = 'text-slate-600 dark:text-slate-400';
            isDashed = true;
            break;
    }

    // Header style adjustments based on type
    const headerStyle = type.includes('novos')
        ? `text-[10px] uppercase font-semibold ${colorClass} mb-2 ml-1`
        : `text-xs font-bold uppercase ${type === 'marketing' ? (isEntrada ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-500'} dark:${colorClass} mb-2 flex items-center gap-1.5`;

    return (
        <div>
            <h4 className={headerStyle}>
                {!type.includes('novos') && <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></div>}
                {title} ({items.length})
            </h4>
            <ul className="space-y-1.5">
                {items.map((nome, idx) => (
                    <li
                        key={`${type}-${idx}`}
                        className={`flex items-center gap-2 text-xs ${itemTextColor} py-1.5 px-3 rounded-md ${bgColor} shadow-sm border ${borderColor} ${isDashed ? 'border-dashed' : ''}`}
                    >
                        <span className="truncate">{nome}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
