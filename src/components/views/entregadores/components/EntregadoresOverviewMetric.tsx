'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { EntregadoresMetricItem } from '../utils/entregadoresMetrics';

const toneStyles: Record<EntregadoresMetricItem['tone'], string> = {
    blue: 'text-[#526f82] dark:text-sky-200',
    emerald: 'text-[#315c49] dark:text-emerald-200',
    rose: 'text-[#936653] dark:text-rose-200',
    amber: 'text-[#806b48] dark:text-amber-200',
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
            className="min-w-0 px-3 py-2 xl:px-4"
        >
            <div className="flex min-w-0 items-center gap-2">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${toneStyles[tone]}`} aria-hidden="true" />
                <dt className="truncate text-xs font-medium text-[#4f5c53] dark:text-slate-300">
                    {label}
                </dt>
            </div>

            <dd className="mt-2 min-h-7 font-sans text-[22px] font-semibold tracking-tight text-[#242b26] tabular-nums dark:text-slate-50">
                <AnimatePresence initial={false} mode="wait">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
                        transition={{ duration: reduceMotion ? 0.08 : 0.12, ease: 'easeOut' }}
                        className="block"
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
                <span className="sr-only">{meta}</span>
            </dd>
        </motion.div>
    );
}
