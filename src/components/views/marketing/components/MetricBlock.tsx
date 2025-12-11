import React from 'react';

interface MetricBlockProps {
    type: 'entradas' | 'saidas';
    marketing: number;
    total: number;
    operacional?: number; // optional if not pre-calculated, but good to pass in
}

export const MetricBlock: React.FC<MetricBlockProps> = ({ type, marketing, total, operacional }) => {
    const isEntrada = type === 'entradas';
    // Calculate operacional if not provided (assume total >= marketing)
    const opsValue = operacional !== undefined ? operacional : Math.max(0, total - marketing);

    const bgColor = isEntrada ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20';
    const titleColor = isEntrada ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70';

    // Mkt styles
    const mktDotColor = isEntrada ? 'bg-emerald-500' : 'bg-rose-500';
    const mktTextColor = isEntrada ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-rose-700/70 dark:text-rose-400/70';
    const mktValueColor = isEntrada ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400';

    // Ops styles
    const opsDotColor = isEntrada ? 'bg-emerald-300' : 'bg-rose-300';
    const opsTextColor = isEntrada ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-rose-700/70 dark:text-rose-400/70';
    const opsValueColor = isEntrada ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400';

    // Footer styles
    const footerBorder = isEntrada ? 'border-emerald-200/50 dark:border-emerald-800/30' : 'border-rose-200/50 dark:border-rose-800/30';
    const totalLabelColor = isEntrada ? 'text-emerald-800/60 dark:text-emerald-300/60' : 'text-rose-800/60 dark:text-rose-300/60';
    const totalValueColor = isEntrada ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400';

    const sign = isEntrada ? '+' : '-';

    return (
        <div className={`rounded-xl ${bgColor} p-3 pt-2`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${titleColor} mb-2 text-center`}>
                {isEntrada ? 'Entradas' : 'Saídas'}
            </p>

            <div className="space-y-1 mb-2">
                <div className="flex justify-between items-center text-xs">
                    <span className={`${mktTextColor} flex items-center gap-1.5`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${mktDotColor}`}></div>
                        Mkt
                    </span>
                    <span className={`font-semibold ${mktValueColor} tabular-nums`}>{sign}{marketing || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className={`${opsTextColor} flex items-center gap-1.5`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${opsDotColor}`}></div>
                        Operacional
                    </span>
                    <span className={`font-semibold ${opsValueColor} tabular-nums`}>
                        {sign}{opsValue}
                    </span>
                </div>
            </div>

            <div className={`flex justify-between items-end border-t ${footerBorder} pt-1.5`}>
                <span className={`text-[10px] font-bold uppercase ${totalLabelColor}`}>Total</span>
                <span className={`text-base font-bold ${totalValueColor} tabular-nums`}>{sign}{total}</span>
            </div>
        </div>
    );
};
