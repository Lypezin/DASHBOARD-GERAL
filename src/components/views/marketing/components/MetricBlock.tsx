import React from 'react';

interface MetricBlockProps {
    type: 'entradas' | 'saidas' | 'retomada';
    marketing: number;
    total: number;
    operacional?: number;
}

export const MetricBlock: React.FC<MetricBlockProps> = ({ type, marketing, total, operacional }) => {
    const isEntrada = type === 'entradas';
    const isRetomada = type === 'retomada';
    const opsValue = operacional !== undefined ? operacional : Math.max(0, total - marketing);

    let bgColor = isEntrada ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20';
    let titleColor = isEntrada ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70';
    let mktDotColor = isEntrada ? 'bg-emerald-500' : 'bg-rose-500';
    let mktTextColor = isEntrada ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-rose-700/70 dark:text-rose-400/70';
    let mktValueColor = isEntrada ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400';
    let opsDotColor = isEntrada ? 'bg-emerald-300' : 'bg-rose-300';
    let opsTextColor = isEntrada ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-rose-700/70 dark:text-rose-400/70';
    let opsValueColor = isEntrada ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400';
    let footerBorder = isEntrada ? 'border-emerald-200/50 dark:border-emerald-800/30' : 'border-rose-200/50 dark:border-rose-800/30';
    let totalLabelColor = isEntrada ? 'text-emerald-800/60 dark:text-emerald-300/60' : 'text-rose-800/60 dark:text-rose-300/60';
    let totalValueColor = isEntrada ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400';
    const sign = isEntrada || isRetomada ? '+' : '-';
    const titleLabel = isEntrada ? 'Entradas' : (isRetomada ? 'Retomada' : 'Sa\u00eddas');

    if (isRetomada) {
        bgColor = 'bg-sky-50 dark:bg-sky-950/20';
        titleColor = 'text-sky-600/70 dark:text-sky-300/70';
        mktDotColor = 'bg-sky-500';
        mktTextColor = 'text-sky-700/70 dark:text-sky-300/70';
        mktValueColor = 'text-sky-700 dark:text-sky-300';
        opsDotColor = 'bg-sky-300';
        opsTextColor = 'text-sky-700/70 dark:text-sky-300/70';
        opsValueColor = 'text-sky-700 dark:text-sky-300';
        footerBorder = 'border-sky-200/50 dark:border-sky-800/30';
        totalLabelColor = 'text-sky-800/60 dark:text-sky-300/60';
        totalValueColor = 'text-sky-700 dark:text-sky-300';
    }

    return (
        <div className={`rounded-xl ${bgColor} p-3 pt-2`}>
            <p className={`mb-2 text-center text-[10px] font-semibold uppercase tracking-wider ${titleColor}`}>
                {titleLabel}
            </p>

            <div className="mb-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className={`${mktTextColor} flex items-center gap-1.5`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${mktDotColor}`} />
                        Mkt
                    </span>
                    <span className={`tabular-nums font-semibold ${mktValueColor}`}>{sign}{marketing || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className={`${opsTextColor} flex items-center gap-1.5`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${opsDotColor}`} />
                        Operacional
                    </span>
                    <span className={`tabular-nums font-semibold ${opsValueColor}`}>
                        {sign}{opsValue}
                    </span>
                </div>
            </div>

            <div className={`flex items-end justify-between border-t ${footerBorder} pt-1.5`}>
                <span className={`text-[10px] font-bold uppercase ${totalLabelColor}`}>Total</span>
                <span className={`tabular-nums text-base font-bold ${totalValueColor}`}>{sign}{total}</span>
            </div>
        </div>
    );
};
