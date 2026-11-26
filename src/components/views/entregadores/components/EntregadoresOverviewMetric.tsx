'use client';

import { motion, type Variants } from 'framer-motion';
import type { EntregadoresMetricItem } from '../utils/entregadoresMetrics';

const toneStyles: Record<EntregadoresMetricItem['tone'], string> = {
    blue: 'text-[#347ca3] dark:text-sky-200',
    emerald: 'text-[#2678a0] dark:text-sky-200',
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
        className="min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 dark:border-t-sky-700 dark:bg-slate-900 xl:px-5"
        >
            <div className="flex min-w-0 items-center gap-2">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${toneStyles[tone]}`} aria-hidden="true" />
                <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">
                    {label}
                </dt>
            </div>

            <dd className="mt-2 min-h-7 font-sans text-[23px] font-semibold tracking-tight text-[#173f5a] tabular-nums dark:text-slate-50">
                <motion.span
                    key={value}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className="block"
                >
                    {value}
                </motion.span>
                <span className="sr-only">{meta}</span>
            </dd>
        </motion.div>
    );
}
