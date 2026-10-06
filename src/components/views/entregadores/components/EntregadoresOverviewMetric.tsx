'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { EntregadoresMetricItem } from '../utils/entregadoresMetrics';

const toneStyles: Record<EntregadoresMetricItem['tone'], string> = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/50',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
};

const metricVariants: Variants = {
    hidden: { opacity: 0, y: 7 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

export function EntregadoresOverviewMetric({
    icon: Icon,
    label,
    value,
    meta,
    tone,
    reduceMotion,
}: EntregadoresMetricItem & { reduceMotion: boolean }) {
    return (
        <motion.div
            variants={reduceMotion ? undefined : metricVariants}
            className="min-w-0 px-2 py-1"
        >
            <div className="flex min-w-0 items-center gap-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${toneStyles[tone]}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <dt className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {label}
                </dt>
            </div>

            <dd className="mt-3 min-h-8 font-mono text-2xl font-semibold tracking-tight text-slate-950 tabular-nums dark:text-slate-50">
                <AnimatePresence initial={false} mode="wait">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
                        transition={{ duration: reduceMotion ? 0.08 : 0.15, ease: 'easeOut' }}
                        className="block"
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
                <span className="mt-1 block truncate font-sans text-xs font-medium text-slate-400 dark:text-slate-500">
                    {meta}
                </span>
            </dd>
        </motion.div>
    );
}
