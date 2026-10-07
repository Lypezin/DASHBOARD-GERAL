import React from 'react';
import { Megaphone, CheckCircle2, XCircle, Flag, Clock } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Totals } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface AnaliseMetricCardsProps {
    totals: Totals;
    taxaAceitacao: number;
    taxaCompletude: number;
    taxaRejeicao: number;
    totalHorasEntregues: number;
}

export const AnaliseMetricCards: React.FC<AnaliseMetricCardsProps> = ({ totals, taxaAceitacao, taxaCompletude, taxaRejeicao, totalHorasEntregues }) => {
    const reduceMotion = useReducedMotion() ?? true;
    const metrics = [
        { title: 'Horas entregues', value: formatarHorasParaHMS(totalHorasEntregues), meta: 'Tempo operacional', icon: Clock, tone: 'blue' as const },
        { title: 'Ofertadas', value: totals.ofertadas.toLocaleString('pt-BR'), meta: 'Corridas oferecidas', icon: Megaphone, tone: 'blue' as const },
        { title: 'Aceitas', value: totals.aceitas.toLocaleString('pt-BR'), icon: CheckCircle2, tone: 'emerald' as const, progress: { value: taxaAceitacao, label: 'Taxa de aceitação' } },
        { title: 'Rejeitadas', value: totals.rejeitadas.toLocaleString('pt-BR'), icon: XCircle, tone: 'rose' as const, progress: { value: taxaRejeicao, label: 'Taxa de rejeição' } },
        { title: 'Completadas', value: totals.completadas.toLocaleString('pt-BR'), icon: Flag, tone: 'sky' as const, progress: { value: taxaCompletude, label: 'Taxa de completude' } },
    ];

    return (
        <section aria-labelledby="analise-period-title" className="space-y-2.5">
            <div className="px-0.5">
                <h2 id="analise-period-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Visão do período</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Indicadores dos filtros selecionados</p>
            </div>

            <motion.dl
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion ? undefined : 'visible'}
                variants={reduceMotion ? undefined : containerVariants}
                className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-5"
            >
                {metrics.map(({ title, value, meta, icon: Icon, tone, progress }) => (
                    <motion.div
                        key={title}
                        variants={reduceMotion ? undefined : metricVariants}
                        className="min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-3.5 py-3 dark:border-t-sky-700 dark:bg-slate-900 xl:px-4"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-300' : tone === 'rose' ? 'text-rose-600 dark:text-rose-300' : tone === 'sky' ? 'text-sky-700 dark:text-sky-300' : 'text-[#347ca3] dark:text-sky-200'}`} aria-hidden="true" />
                            <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">{title}</dt>
                        </div>
                        <dd className="mt-2 min-w-0 text-[#173f5a] dark:text-slate-50">
                            <span className="block truncate text-[22px] font-semibold leading-7 tracking-tight tabular-nums" title={value}>{value}</span>
                            {progress ? (
                                <div className="mt-2.5">
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={progress.label} aria-valuenow={Math.min(Math.max(progress.value, 0), 100)} aria-valuemin={0} aria-valuemax={100}>
                                        <div className={`h-full rounded-full transition-[width] duration-200 ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-sky-600'}`} style={{ width: `${Math.min(Math.max(progress.value, 0), 100)}%` }} />
                                    </div>
                                    <div className="mt-1 flex items-center justify-between gap-1 text-[10px] leading-4">
                                        <span className="truncate text-slate-500 dark:text-slate-400">{progress.label}</span>
                                        <span className={`shrink-0 font-mono font-semibold tabular-nums ${tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' : tone === 'rose' ? 'text-rose-700 dark:text-rose-300' : 'text-sky-700 dark:text-sky-300'}`}>{progress.value.toFixed(1)}%</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="mt-1 block truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400">{meta}</span>
                            )}
                        </dd>
                    </motion.div>
                ))}
            </motion.dl>
        </section>
    );
};

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.03, staggerChildren: 0.035 } },
};

const metricVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};
