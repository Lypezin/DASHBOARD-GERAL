import React from 'react';
import { Activity, Car, Timer } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { UtrGeral as UtrGeralType } from '@/types';
import { formatCompactTime, formatarHorasParaHMS } from '@/utils/formatters';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    const fullTime = formatarHorasParaHMS(data.tempo_horas ?? 0);
    const compactTime = formatCompactTime(fullTime);
    const formattedCorridas = (data.corridas ?? 0).toLocaleString('pt-BR');
    const reduceMotion = useReducedMotion() ?? true;
    const metrics = [
        { title: 'UTR consolidada', value: (data.utr ?? 0).toFixed(2), meta: 'Média do período', icon: Activity },
        { title: 'Tempo total', value: compactTime, meta: `${fullTime} · Horas operacionais`, icon: Timer },
        { title: 'Total de corridas', value: formattedCorridas, meta: 'Volume de entregas aceitas', icon: Car },
    ];

    return (
        <section aria-labelledby="utr-period-title" className="space-y-2.5">
            <div className="px-0.5">
                <h2 id="utr-period-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Visão do período</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Indicadores dos filtros selecionados</p>
            </div>
            <motion.dl
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion ? undefined : 'visible'}
                variants={reduceMotion ? undefined : containerVariants}
                className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-3"
            >
                {metrics.map(({ title, value, meta, icon: Icon }) => (
                    <motion.div
                        key={title}
                        variants={reduceMotion ? undefined : metricVariants}
                        className="min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 dark:border-t-sky-700 dark:bg-slate-900 sm:px-5"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-[#347ca3] dark:text-sky-200" aria-hidden="true" />
                            <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">{title}</dt>
                        </div>
                        <dd className="mt-2 min-h-[3.75rem] min-w-0 text-[#173f5a] dark:text-slate-50">
                            <span className="block truncate text-[22px] font-semibold leading-7 tracking-tight tabular-nums" title={value}>{value}</span>
                            <span className="mt-1 block truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400" title={meta}>{meta}</span>
                        </dd>
                    </motion.div>
                ))}
            </motion.dl>
        </section>
    );
});

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.03, staggerChildren: 0.035 } },
};

const metricVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

UtrGeral.displayName = 'UtrGeral';
